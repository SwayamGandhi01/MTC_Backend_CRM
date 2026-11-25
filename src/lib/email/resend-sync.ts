import { Resend } from "resend";
import { connectToDatabase } from "@/lib/db/mongodb";
import { EmailLog, IEmailLog } from "@/models/EmailLog";
import { ResendSyncLog, IResendSyncLog } from "@/models/ResendSyncLog";
import { publishRealtimeDashboardEvent } from "@/lib/events/business-events";

export interface SyncResult {
  syncId: string;
  status: "completed" | "failed" | "interrupted";
  totalDiscovered: number;
  totalImported: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFailed: number;
  pagesProcessed: number;
  hasMore: boolean;
  lastCursor?: string;
  durationMs: number;
  error?: string;
}

/**
 * Maps Resend last_event strings to MTC CRM authoritative statuses.
 */
export function mapResendEventToStatus(
  event?: string | null
): "Sent" | "Delivered" | "Delayed" | "Bounced" | "Complained" | "Opened" | "Clicked" | "Failed" | "Queued" | "Scheduled" {
  switch (event?.toLowerCase()) {
    case "delivered":
      return "Delivered";
    case "opened":
      return "Opened";
    case "clicked":
      return "Clicked";
    case "bounced":
    case "suppressed":
      return "Bounced";
    case "complained":
      return "Complained";
    case "delivery_delayed":
      return "Delayed";
    case "failed":
    case "canceled":
      return "Failed";
    case "queued":
      return "Queued";
    case "scheduled":
      return "Scheduled";
    case "sent":
    default:
      return "Sent";
  }
}

/**
 * Status priority hierarchy to protect live events from being downgraded by historical imports.
 */
const STATUS_PRIORITY: Record<string, number> = {
  Queued: 1,
  Scheduled: 1,
  Sent: 2,
  Delayed: 2,
  Delivered: 3,
  Opened: 4,
  Clicked: 5,
  Bounced: 6,
  Complained: 6,
  Failed: 6,
};

/**
 * Core engine for importing and synchronizing historical emails from Resend into MongoDB Atlas.
 */
export async function syncResendHistoricalEmails(options: {
  triggeredBy?: string;
  resume?: boolean;
  maxPages?: number;
}): Promise<SyncResult> {
  await connectToDatabase();

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured in the environment.");
  }

  const triggeredBy = options.triggeredBy || "system";
  const maxPages = options.maxPages || 50; // Safeguard limit per run

  // 1. Concurrency Mutex: Check if a sync is already running
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const activeSync = await ResendSyncLog.findOne({
    status: "in_progress",
    startedAt: { $gte: fiveMinutesAgo },
  });

  if (activeSync) {
    throw new Error(
      `A historical synchronization (${activeSync.syncId}) is already in progress. Please wait for it to finish.`
    );
  }

  // 2. Initialize or Resume Sync Record
  let cursor: string | undefined = undefined;
  if (options.resume) {
    const lastInterrupted = await ResendSyncLog.findOne({
      status: { $in: ["interrupted", "in_progress"] },
      lastCursor: { $exists: true, $ne: "" },
    }).sort({ startedAt: -1 });

    if (lastInterrupted && lastInterrupted.lastCursor) {
      cursor = lastInterrupted.lastCursor;
    }
  }

  const syncId = `sync_resend_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const syncRecord = await ResendSyncLog.create({
    syncId,
    status: "in_progress",
    startedAt: new Date(),
    lastCursor: cursor,
    triggeredBy,
    totalDiscovered: 0,
    totalImported: 0,
    totalUpdated: 0,
    totalSkipped: 0,
    totalFailed: 0,
    pagesProcessed: 0,
  });

  const startTime = Date.now();
  const resend = new Resend(apiKey);

  let hasMore = true;
  let pagesProcessed = 0;
  let totalDiscovered = 0;
  let totalImported = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  try {
    while (hasMore && pagesProcessed < maxPages) {
      // Call Resend API with cursor pagination (up to 100 per page)
      const listParams: { limit: number; after?: string } = { limit: 100 };
      if (cursor) {
        listParams.after = cursor;
      }

      const response = await resend.emails.list(listParams);

      if (response.error || !response.data) {
        throw new Error(
          response.error?.message || "Failed to retrieve emails from Resend API"
        );
      }

      const emails = response.data.data || [];
      hasMore = Boolean(response.data.has_more);
      pagesProcessed++;
      totalDiscovered += emails.length;

      // Process batch of emails atomically
      for (const item of emails) {
        try {
          const resendId = item.id;
          const recipient = Array.isArray(item.to)
            ? item.to[0]?.toLowerCase().trim()
            : String(item.to || "").toLowerCase().trim();

          const mappedStatus = mapResendEventToStatus(item.last_event);
          const sentDate = item.created_at ? new Date(item.created_at) : new Date();

          // 3. Check for existing record by resendMessageId
          const existing = await EmailLog.findOne({ resendMessageId: resendId });

          if (existing) {
            // Reconcile status without overwriting newer live webhook events
            const currentPriority = STATUS_PRIORITY[existing.status] || 0;
            const newPriority = STATUS_PRIORITY[mappedStatus] || 0;

            let updatedFields: Record<string, any> = {};

            // Only upgrade status if imported status has higher priority
            if (newPriority > currentPriority) {
              updatedFields.status = mappedStatus;
            }

            if (!existing.providerMessageId && item.message_id) {
              updatedFields.providerMessageId = item.message_id;
            }

            // Check if timeline already records this event
            const hasEvent = existing.deliveryTimeline?.some(
              (e) =>
                e.event === `resend.${item.last_event}` ||
                (e.event === "email.delivered" && mappedStatus === "Delivered")
            );

            if (!hasEvent && item.last_event) {
              await EmailLog.updateOne(
                { _id: existing._id },
                {
                  $set: updatedFields,
                  $push: {
                    deliveryTimeline: {
                      event: `resend.${item.last_event}`,
                      timestamp: sentDate,
                      data: { historicalImport: true, lastEvent: item.last_event },
                    },
                  },
                }
              );
              totalUpdated++;
            } else if (Object.keys(updatedFields).length > 0) {
              await EmailLog.updateOne({ _id: existing._id }, { $set: updatedFields });
              totalUpdated++;
            } else {
              totalSkipped++;
            }
          } else {
            // Check if there is an unlinked CRM log that matches by providerMessageId or subject + recipient + timestamp
            const legacyMatch = await EmailLog.findOne({
              $or: [
                ...(item.message_id ? [{ providerMessageId: item.message_id }] : []),
                {
                  recipient,
                  subject: item.subject,
                  sentAt: {
                    $gte: new Date(sentDate.getTime() - 60000),
                    $lte: new Date(sentDate.getTime() + 60000),
                  },
                  resendMessageId: { $exists: false },
                },
              ],
            });

            if (legacyMatch) {
              // Reconcile and link existing CRM email
              legacyMatch.resendMessageId = resendId;
              if (item.message_id) legacyMatch.providerMessageId = item.message_id;
              const curPriority = STATUS_PRIORITY[legacyMatch.status] || 0;
              const newPri = STATUS_PRIORITY[mappedStatus] || 0;
              if (newPri > curPriority) {
                legacyMatch.status = mappedStatus;
              }
              legacyMatch.deliveryTimeline.push({
                event: `resend.${item.last_event || "sent"}`,
                timestamp: sentDate,
                data: { historicalImportReconciled: true, resendLastEvent: item.last_event },
              });
              await legacyMatch.save();
              totalUpdated++;
            } else {
              // Insert new historical email record
              await EmailLog.create({
                recipient: recipient || "unknown@recipient.com",
                subject: item.subject || "Notification",
                templateName: "resend-historical",
                status: mappedStatus,
                origin: "resend_import",
                resendMessageId: resendId,
                providerMessageId: item.message_id || undefined,
                sender: item.from || "info@mobiletyrechampions.com",
                category: "customer",
                sentAt: sentDate,
                deliveryTimeline: [
                  {
                    event: `resend.${item.last_event || "sent"}`,
                    timestamp: sentDate,
                    data: {
                      historicalImport: true,
                      resendLastEvent: item.last_event,
                    },
                  },
                ],
                metadata: {
                  importedAt: new Date(),
                  bcc: item.bcc,
                  cc: item.cc,
                  replyTo: item.reply_to,
                  scheduledAt: item.scheduled_at,
                },
              });
              totalImported++;
            }
          }
        } catch (itemErr: any) {
          console.warn(`[Resend Sync] Failed to process email ${item.id}:`, itemErr?.message);
          totalFailed++;
        }
      }

      // Update cursor to last processed email ID for next page
      if (emails.length > 0) {
        cursor = emails[emails.length - 1].id;
      }

      // Respect Resend API rate limits (150ms backoff between pages)
      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }

    // 4. Mark Sync Completed
    const durationMs = Date.now() - startTime;
    syncRecord.status = "completed";
    syncRecord.completedAt = new Date();
    syncRecord.totalDiscovered = totalDiscovered;
    syncRecord.totalImported = totalImported;
    syncRecord.totalUpdated = totalUpdated;
    syncRecord.totalSkipped = totalSkipped;
    syncRecord.totalFailed = totalFailed;
    syncRecord.pagesProcessed = pagesProcessed;
    syncRecord.lastCursor = cursor;
    syncRecord.hasMore = hasMore;
    await syncRecord.save();

    // 5. Broadcast real-time update to active dashboard and Email Centre clients
    try {
      await publishRealtimeDashboardEvent({
        eventId: `evt_resend_sync_${Date.now()}`,
        eventType: "email.sync_completed",
        entityType: "email",
        entityId: syncId,
        payload: {
          syncId,
          totalDiscovered,
          totalImported,
          totalUpdated,
          totalSkipped,
          pagesProcessed,
          hasMore,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {}

    return {
      syncId,
      status: "completed",
      totalDiscovered,
      totalImported,
      totalUpdated,
      totalSkipped,
      totalFailed,
      pagesProcessed,
      hasMore,
      lastCursor: cursor,
      durationMs,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    syncRecord.status = "failed";
    syncRecord.completedAt = new Date();
    syncRecord.errorMessage = error?.message || String(error);
    syncRecord.totalDiscovered = totalDiscovered;
    syncRecord.totalImported = totalImported;
    syncRecord.totalUpdated = totalUpdated;
    syncRecord.totalSkipped = totalSkipped;
    syncRecord.totalFailed = totalFailed;
    syncRecord.pagesProcessed = pagesProcessed;
    syncRecord.lastCursor = cursor;
    syncRecord.hasMore = hasMore;
    await syncRecord.save();

    return {
      syncId,
      status: "failed",
      totalDiscovered,
      totalImported,
      totalUpdated,
      totalSkipped,
      totalFailed,
      pagesProcessed,
      hasMore,
      lastCursor: cursor,
      durationMs,
      error: error?.message || String(error),
    };
  }
}

/**
 * Returns latest synchronization status and stats.
 */
export async function getLatestSyncStatus(): Promise<IResendSyncLog | null> {
  await connectToDatabase();
  return ResendSyncLog.findOne().sort({ startedAt: -1 }).lean();
}
