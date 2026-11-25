import { connectToDatabase } from "@/lib/db/mongodb";
import { BusinessEvent, BusinessEventType, EventEntityType } from "@/models/BusinessEvent";
import { sseManager } from "@/lib/realtime/sse-manager";
import Ably from "ably";

export interface RecordBusinessEventParams {
  eventId?: string;
  eventType: BusinessEventType | string;
  entityType: EventEntityType;
  entityId: string;
  source: "strapi" | "crm" | "website";
  payload: Record<string, any>;
}

/**
 * Publishes real-time notification to active dashboard clients across Ably and SSE.
 */
export async function publishRealtimeDashboardEvent(event: {
  eventId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, any>;
}) {
  // 1. Broadcast to Server-Sent Events (SSE) connections
  try {
    sseManager.broadcast({
      type: event.eventType,
      payload: {
        eventId: event.eventId,
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: event.payload,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.warn("[Realtime SSE Broadcast Error]", err?.message);
  }

  // 2. Publish to Ably if API key is configured
  const ablyKey = process.env.ABLY_API_KEY?.trim();
  if (ablyKey) {
    try {
      const rest = new Ably.Rest(ablyKey);
      const channel = rest.channels.get("dashboard:operations");
      await channel.publish(event.eventType, {
        eventId: event.eventId,
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: event.payload,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn("[Ably Publish Error]", err?.message);
    }
  }
}

/**
 * Centralized business event recorder & outbox dispatcher.
 * Persists event, notifies dashboards, and dispatches relevant emails safely.
 */
export async function recordBusinessEvent(params: RecordBusinessEventParams) {
  await connectToDatabase();

  const eventId = params.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // 1. Persist Outbox Event record
  const eventRecord = await BusinessEvent.findOneAndUpdate(
    { eventId },
    {
      eventId,
      eventType: params.eventType,
      entityType: params.entityType,
      entityId: params.entityId,
      source: params.source,
      payload: params.payload,
      status: "pending",
      $inc: { attempts: 1 },
    },
    { upsert: true, new: true }
  );

  try {
    // 2. Publish Real-time Dashboard Notification
    await publishRealtimeDashboardEvent({
      eventId,
      eventType: params.eventType,
      entityType: params.entityType,
      entityId: params.entityId,
      payload: params.payload,
    });

    // 3. Mark event processed in outbox
    eventRecord.status = "processed";
    eventRecord.processedAt = new Date();
    await eventRecord.save();

    return eventRecord;
  } catch (err: any) {
    console.error(`[Business Event Processing Error] Event ${eventId}:`, err?.message || err);
    eventRecord.status = "failed";
    eventRecord.lastError = err?.message || String(err);
    await eventRecord.save();
    return eventRecord;
  }
}
