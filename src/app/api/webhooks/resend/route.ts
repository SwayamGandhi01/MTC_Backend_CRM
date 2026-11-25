import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/mongodb";
import { EmailLog } from "@/models/EmailLog";

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

  // 4. Update EmailLog record idempotently
  const emailLog = await EmailLog.findOne({ resendMessageId });

  if (emailLog) {
    // Check if this event was already logged
    const alreadyLogged = emailLog.deliveryTimeline.some(
      (e) => e.event === type && Math.abs(new Date(e.timestamp).getTime() - eventTimestamp.getTime()) < 1000
    );

    if (!alreadyLogged) {
      emailLog.deliveryTimeline.push({
        event: type,
        timestamp: eventTimestamp,
        data: data || {},
      });
    }

    // Do not downgrade terminal status (e.g., Delivered/Bounced/Complained shouldn't be reverted by delayed Sent event)
    const terminalStatuses = ["Delivered", "Bounced", "Complained"];
    if (mappedStatus) {
      if (!terminalStatuses.includes(emailLog.status) || terminalStatuses.includes(mappedStatus)) {
        emailLog.status = mappedStatus;
      }
    }

    emailLog.lastEventAt = new Date();
    await emailLog.save();
  } else {
    // Create standalone email record if dispatched prior or external
    if (mappedStatus) {
      await EmailLog.create({
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
            data: data || {},
          },
        ],
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Processed ${type} event for ${resendMessageId}`,
  });
}
