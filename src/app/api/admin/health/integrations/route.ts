import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/roles";
import { connectToDatabase, getConnectionStatus } from "@/lib/db/mongodb";
import { StrapiWebhookLog } from "@/models/StrapiWebhookLog";
import { EmailLog } from "@/models/EmailLog";
import { BusinessEvent } from "@/models/BusinessEvent";
import { sseManager } from "@/lib/realtime/sse-manager";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/health/integrations
 * 
 * Provides comprehensive integration health diagnostics:
 * - MongoDB Atlas
 * - Strapi Outbound Webhook Integration
 * - Resend Email Integration
 * - Real-Time Pub/Sub Transport
 * - Unified Business Event Outbox
 */
export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  await connectToDatabase({ silent: true });
  const dbStatus = getConnectionStatus();

  // Strapi Webhook Statistics
  const [
    strapiProcessed,
    strapiDuplicate,
    strapiFailed,
    lastStrapiEvent,
    emailTotal,
    emailDelivered,
    emailFailed,
    lastEmail,
    outboxPending,
    outboxProcessed,
    outboxFailed,
  ] = await Promise.all([
    StrapiWebhookLog.countDocuments({ status: "processed" }),
    StrapiWebhookLog.countDocuments({ status: "duplicate" }),
    StrapiWebhookLog.countDocuments({ status: "failed" }),
    StrapiWebhookLog.findOne().sort({ receivedAt: -1 }).select("receivedAt eventType status").lean(),
    EmailLog.countDocuments(),
    EmailLog.countDocuments({ status: { $in: ["Delivered", "Opened"] } }),
    EmailLog.countDocuments({ status: { $in: ["Failed", "Bounced", "Complained"] } }),
    EmailLog.findOne().sort({ sentAt: -1 }).select("sentAt subject status").lean(),
    BusinessEvent.countDocuments({ status: "pending" }),
    BusinessEvent.countDocuments({ status: "processed" }),
    BusinessEvent.countDocuments({ status: "failed" }),
  ]);

  const latencyMs = Date.now() - start;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus.connected ? "healthy" : "disconnected",
      name: dbStatus.database,
      host: dbStatus.host,
      latencyMs,
    },
    strapiIntegration: {
      status: process.env.STRAPI_CRM_WEBHOOK_SECRET ? "configured" : "unconfigured",
      eventsProcessed: strapiProcessed,
      duplicatesIgnored: strapiDuplicate,
      failures: strapiFailed,
      lastReceivedAt: lastStrapiEvent?.receivedAt || null,
      lastEventType: lastStrapiEvent?.eventType || null,
    },
    resendEmail: {
      status: process.env.RESEND_API_KEY ? "live" : "simulation",
      webhookConfigured: Boolean(process.env.RESEND_WEBHOOK_SECRET),
      senderIdentity: process.env.EMAIL_FROM || "info@mobiletyrechampions.com",
      totalDispatched: emailTotal,
      delivered: emailDelivered,
      failures: emailFailed,
      lastSentAt: lastEmail?.sentAt || null,
    },
    realtimeTransport: {
      provider: process.env.ABLY_API_KEY ? "ably" : "sse_fallback",
      activeSseConnections: sseManager.getClientCount(),
    },
    eventOutbox: {
      pending: outboxPending,
      processed: outboxProcessed,
      failed: outboxFailed,
    },
  });
}
