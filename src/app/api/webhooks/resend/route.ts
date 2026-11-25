import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/mongodb";
import { EmailLog } from "@/models/EmailLog";
import { publishRealtimeDashboardEvent } from "@/lib/events/business-events";

export const dynamic = "force-dynamic";

/**
 * Verifies Svix-based Resend webhook signatures.
 */
function verifyResendSignature(
  rawBody: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): boolean {
  try {
    // Secret format from Resend is usually 'whsec_...'
    const cleanSecret = secret.startsWith("whsec_")
      ? Buffer.from(secret.slice(6), "base64")
      : secret;

    const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", cleanSecret)
      .update(toSign)
      .digest("base64");

    // svix-signature may contain multiple space-separated signatures: "v1,..."
    const signatures = svixSignature.split(" ");
    for (const sig of signatures) {
      const parts = sig.split(",");
      const version = parts[0];
      const val = parts[1] || parts[0];

      if (version === "v1" || !sig.includes(",")) {
        const expectedBuffer = Buffer.from(expected);
        const actualBuffer = Buffer.from(val);
        if (
          expectedBuffer.length === actualBuffer.length &&
          crypto.timingSafeEqual(expectedBuffer, actualBuffer)
        ) {
          return true;
        }
      }
    }

    return false;
  } catch (err: any) {
    console.error("[Resend Signature Verification Error]", err?.message);
    return false;
  }
}

/**
 * POST /api/webhooks/resend
 * 
 * Processes transactional email delivery, open, bounce, and complaint webhooks from Resend.
 */
export async function POST(req: NextRequest) {
  await connectToDatabase();

  const rawBody = await req.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();

  // 1. Signature Verification (if secret is configured)
  if (secret) {
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: "Missing required svix signature headers" },
        { status: 401 }
      );
    }

    // Verify timestamp drift (< 5 minutes)
    const timestampMs = Number(svixTimestamp) * 1000;
    if (isNaN(timestampMs) || Math.abs(Date.now() - timestampMs) > 300000) {
      return NextResponse.json(
        { error: "Webhook timestamp has expired" },
        { status: 401 }
      );
    }

    const isValid = verifyResendSignature(rawBody, svixId, svixTimestamp, svixSignature, secret);
    if (!isValid) {
      console.warn("[Resend Webhook] Invalid signature rejected.");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }
  }

  // 2. Parse event payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON payload" },
      { status: 400 }
    );
  }

  const { type, data, created_at } = payload;
  if (!type || !data?.email_id) {
    return NextResponse.json(
      { error: "Missing event type or email_id" },
      { status: 400 }
    );
  }

  const resendMessageId = data.email_id;
  const eventTimestamp = created_at ? new Date(created_at) : new Date();

  // 3. Map event type to status
  let mappedStatus: "Sent" | "Delivered" | "Delayed" | "Bounced" | "Complained" | "Opened" | "Clicked" | "Failed" | null = null;
  switch (type) {
    case "email.sent":
      mappedStatus = "Sent";
      break;
    case "email.delivered":
      mappedStatus = "Delivered";
      break;
    case "email.delivery_delayed":
      mappedStatus = "Delayed";
      break;
    case "email.bounced":
      mappedStatus = "Bounced";
      break;
    case "email.complained":
      mappedStatus = "Complained";
      break;
    case "email.opened":
      mappedStatus = "Opened";
      break;
    case "email.clicked":
      mappedStatus = "Clicked";
      break;
    case "email.failed":
      mappedStatus = "Failed";
      break;
    default:
      mappedStatus = null;
  }

  // 4. Update EmailLog record idempotently & handle out-of-order events
  const svixIdHeader = req.headers.get("svix-id");
  let emailLog = await EmailLog.findOne({ resendMessageId });

  // Status priority hierarchy for progression
  const STATUS_RANKS: Record<string, number> = {
    Queued: 1,
    Sent: 2,
    Delayed: 2,
    Delivered: 3,
    Opened: 4,
    Clicked: 5,
  };
  const TERMINAL_FAILURE_STATUSES = ["Bounced", "Complained", "Failed"];

  if (emailLog) {
    // 4a. Idempotency check: verify if this specific webhook event has already been recorded
    const isDuplicate = emailLog.deliveryTimeline.some(
      (e) =>
        (svixIdHeader && e.data?.svixId === svixIdHeader) ||
        (e.event === type && Math.abs(new Date(e.timestamp).getTime() - eventTimestamp.getTime()) < 1000)
    );

    if (isDuplicate) {
      return NextResponse.json({
        success: true,
        message: `Duplicate ${type} event ignored for ${resendMessageId}`,
        duplicate: true,
      });
    }

    // Record the verified event in the delivery timeline
    emailLog.deliveryTimeline.push({
      event: type,
      timestamp: eventTimestamp,
      data: {
        ...(data || {}),
        svixId: svixIdHeader || undefined,
      },
    });

    // 4b. Out-of-order handling: calculate whether mappedStatus should update document status
    if (mappedStatus) {
      const isCurrentFailure = TERMINAL_FAILURE_STATUSES.includes(emailLog.status);
      const isNewFailure = TERMINAL_FAILURE_STATUSES.includes(mappedStatus);

      if (isNewFailure) {
        // Failure states always take priority
        emailLog.status = mappedStatus;
      } else if (!isCurrentFailure) {
        // Compare progression ranks to avoid downgrading (e.g., Opened -> Delivered or Delivered -> Sent)
        const currentRank = STATUS_RANKS[emailLog.status] || 0;
        const newRank = STATUS_RANKS[mappedStatus] || 0;
        if (newRank >= currentRank) {
          emailLog.status = mappedStatus;
        }
      }
    }

    emailLog.lastEventAt = new Date();
    await emailLog.save();
  } else {
    // 4c. Create standalone email record if dispatched prior or external
    if (mappedStatus) {
      emailLog = await EmailLog.create({
        recipient: Array.isArray(data.to) ? data.to[0] : (data.to || "unknown@recipient.com"),
        subject: data.subject || "Notification",
        templateName: "external-resend",
        status: mappedStatus,
        resendMessageId,
        category: "customer",
        sentAt: eventTimestamp,
        deliveryTimeline: [
          {
            event: type,
            timestamp: eventTimestamp,
            data: {
              ...(data || {}),
              svixId: svixIdHeader || undefined,
            },
          },
        ],
      });
    }
  }

  // 5. Broadcast real-time dashboard notification
  try {
    await publishRealtimeDashboardEvent({
      eventId: `evt_resend_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType: type || "email.status_updated",
      entityType: "email",
      entityId: emailLog ? emailLog._id.toString() : resendMessageId,
      payload: {
        resendMessageId,
        status: emailLog ? emailLog.status : mappedStatus,
        recipient: emailLog ? emailLog.recipient : (Array.isArray(data.to) ? data.to[0] : (data.to || "")),
        subject: emailLog ? emailLog.subject : (data.subject || ""),
        templateName: emailLog ? emailLog.templateName : "external-resend",
        referenceId: emailLog?.referenceId,
        timestamp: eventTimestamp.toISOString(),
      },
    });
  } catch (broadcastErr: any) {
    console.warn("[Resend Webhook] Failed to broadcast real-time event:", broadcastErr?.message);
  }

  return NextResponse.json({
    success: true,
    message: `Processed ${type} event for ${resendMessageId}`,
    status: emailLog ? emailLog.status : mappedStatus,
  });
}
