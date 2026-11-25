import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Appointment } from "@/models/Appointment";
import { Enquiry } from "@/models/Enquiry";
import { CallbackRequest } from "@/models/CallbackRequest";
import { StrapiWebhookLog } from "@/models/StrapiWebhookLog";
import { findOrCreateCustomer, generateReferenceId } from "@/lib/db/customer-helper";
import { recordBusinessEvent } from "@/lib/events/business-events";

export const dynamic = "force-dynamic";

/**
 * Constant-time HMAC-SHA256 signature verification.
 */
function verifyHmacSignature(rawBody: string, signature: string, timestamp: string, secret: string): boolean {
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expected, "hex");
    const providedClean = signature.replace(/^sha256=/i, "").trim();
    const providedBuffer = Buffer.from(providedClean, "hex");

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

/**
 * POST /api/integrations/strapi/events
 * 
 * Secure server-to-server webhook endpoint for receiving website customer submissions from Strapi.
 * Protected by HMAC-SHA256 signature and timestamp drift validation.
 */
export async function POST(req: NextRequest) {
  const receivedAt = new Date();
  await connectToDatabase();

  const secret = process.env.STRAPI_CRM_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Strapi Webhook] STRAPI_CRM_WEBHOOK_SECRET is not configured on CRM server.");
    return NextResponse.json(
      { error: "Webhook integration is not configured" },
      { status: 500 }
    );
  }

  // 1. Validate signature & timestamp headers
  const signature = req.headers.get("x-mtc-signature") || req.headers.get("x-hub-signature-256");
  const timestamp = req.headers.get("x-mtc-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json(
      { error: "Missing required authentication headers (x-mtc-signature, x-mtc-timestamp)" },
      { status: 401 }
    );
  }

  // 2. Prevent replay attacks: Reject timestamps with > 5 minutes drift (300,000 ms)
  const now = Date.now();
  const tsNum = Number(timestamp);
  // Support both epoch seconds and epoch milliseconds
  const tsMs = tsNum < 10000000000 ? tsNum * 1000 : tsNum;
  if (isNaN(tsMs) || Math.abs(now - tsMs) > 300000) {
    return NextResponse.json(
      { error: "Webhook timestamp has expired or is invalid (drift > 300s)" },
      { status: 401 }
    );
  }

  // 3. Read raw body text for signature calculation
  const rawBody = await req.text();
  const isValidSignature = verifyHmacSignature(rawBody, signature, timestamp, secret);

  if (!isValidSignature) {
    console.warn(`[Strapi Webhook] Invalid signature rejected from IP: ${req.headers.get("x-forwarded-for") || "unknown"}`);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  // 4. Parse JSON payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON payload" },
      { status: 400 }
    );
  }

  const { eventId, eventType, source, data } = payload;
  if (!eventId || !eventType || !data?.externalId || !data?.type) {
    return NextResponse.json(
      { error: "Invalid event schema. Required: eventId, eventType, data.externalId, data.type" },
      { status: 400 }
    );
  }

  const externalId = String(data.externalId);
  const type = String(data.type).toLowerCase();
  const attributes = data.attributes || {};

  // 5. Idempotency Check: Prevent duplicate event processing
  const existingLog = await StrapiWebhookLog.findOne({
    $or: [
      { eventId },
      { externalId, eventType, status: "processed" },
    ],
  });

  if (existingLog && existingLog.status === "processed") {
    return NextResponse.json({
      success: true,
      duplicate: true,
      message: `Event ${eventId} has already been processed`,
      processedAt: existingLog.processedAt,
    });
  }

  // Create audit log entry
  const logEntry = await StrapiWebhookLog.findOneAndUpdate(
    { eventId },
    {
      eventId,
      eventType,
      externalId,
      source: source || "strapi",
      status: "processed",
      signatureValid: true,
      payload,
      receivedAt,
      processedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  try {
    let resultRecord: any = null;
    let businessEventType = "appointment.created";
    let entityType: "appointment" | "enquiry" | "callback" = "appointment";

    // 6. Map and persist to CRM MongoDB based on Strapi Collection Type
    if (type === "appointment" || type === "book-appointment") {
      entityType = "appointment";
      businessEventType = "appointment.created";

      const customerName = (attributes.fullName || attributes.customerName || "Website Customer").trim();
      const customerPhone = (attributes.phoneNumber || attributes.phone || "").trim();
      const customerEmail = attributes.email?.trim() || undefined;
      const postcode = (attributes.postcode || attributes.location || "UNKNOWN").toUpperCase().trim();
      const vehicleReg = (attributes.vehicleReg || attributes.carModel || "N/A").toUpperCase().trim();
      const serviceType = attributes.serviceType || "Mobile Tyre Fitting";
      const timingSlot = attributes.timingSlot || "As Soon As Possible";
      const referenceId = generateReferenceId("APT");

      // Upsert customer profile
      const customer = await findOrCreateCustomer({
        fullName: customerName,
        phoneNumber: customerPhone,
        email: customerEmail,
        postcode,
        vehicleReg: vehicleReg !== "N/A" ? vehicleReg : undefined,
        address: attributes.address || attributes.location,
        type: "booking",
      });

      resultRecord = await Appointment.findOneAndUpdate(
        { externalId, sourceSystem: "strapi" },
        {
          $setOnInsert: {
            referenceId,
            bookingRef: referenceId.replace("MTC-", "REF-"),
          },
          customer: customer._id,
          customerName,
          customerPhone,
          customerEmail,
          vehicleReg,
          postcode,
          address: attributes.address || attributes.location,
          locationNotes: attributes.locationNotes,
          latitude: attributes.latitude,
          longitude: attributes.longitude,
          serviceType,
          tyreSize: attributes.tyreSize,
          tyreQuantity: attributes.tyreQuantity ? Number(attributes.tyreQuantity) : 1,
          timingSlot,
          bookingDate: attributes.bookingDate ? new Date(attributes.bookingDate) : new Date(),
          status: "pending",
          paymentStatus: "pending",
          sourcePage: attributes.sourcePage || "/booking",
          source: "website",
          sourceSystem: "strapi",
          externalId,
          eventId,
          receivedAt,
          idempotencyKey: attributes.idempotencyKey || `strapi_${externalId}`,
        },
        { upsert: true, new: true }
      );
    } else if (
      type === "contact-request" ||
      type === "quote-request" ||
      type === "emergency-request"
    ) {
      entityType = "enquiry";
      const isEmergency = type === "emergency-request" || /emergency/i.test(attributes.serviceRequired || attributes.serviceType || "");
      businessEventType = isEmergency ? "emergency_request.created" : "enquiry.created";

      const fullName = (attributes.fullName || "Website Visitor").trim();
      const phoneNumber = (attributes.phoneNumber || "").trim();
      const email = attributes.email?.trim() || undefined;
      const postcode = (attributes.postcode || attributes.location || "UNKNOWN").toUpperCase().trim();
      const vehicleReg = (attributes.vehicleReg || attributes.regNumber || attributes.vehicleType || "").toUpperCase().trim();
      const serviceRequired = attributes.serviceRequired || attributes.serviceType || (isEmergency ? "Emergency Tyre Assistance" : "Tyre Quote Enquiry");
      const message = attributes.message || attributes.issue || (isEmergency ? "Roadside emergency assistance callout request" : "Customer enquiry from website");
      const referenceId = generateReferenceId("ENQ");

      const customer = await findOrCreateCustomer({
        fullName,
        phoneNumber,
        email,
        postcode,
        vehicleReg: vehicleReg ? vehicleReg : undefined,
        address: attributes.location,
        type: "enquiry",
      });

      resultRecord = await Enquiry.findOneAndUpdate(
        { externalId, sourceSystem: "strapi" },
        {
          $setOnInsert: {
            referenceId,
          },
          customer: customer._id,
          fullName,
          phoneNumber,
          email,
          postcode,
          vehicleReg: vehicleReg || undefined,
          serviceRequired,
          tyreSize: attributes.tyreSize,
          message,
          status: "new",
          sourcePage: isEmergency ? "/emergency" : "/contact",
          source: "website",
          sourceSystem: "strapi",
          externalId,
          eventId,
          receivedAt,
          idempotencyKey: attributes.idempotencyKey || `strapi_${externalId}`,
        },
        { upsert: true, new: true }
      );
    } else if (type === "arrange-a-call-back") {
      entityType = "callback";
      businessEventType = "callback.created";

      const mobileNumber = (attributes.mobileNumber || attributes.phoneNumber || "").trim();
      const postcode = (attributes.postcode || "UNKNOWN").toUpperCase().trim();
      const regNumber = (attributes.regNumber || "").toUpperCase().trim();
      const referenceId = generateReferenceId("CB");

      const customer = await findOrCreateCustomer({
        fullName: regNumber ? `Vehicle ${regNumber}` : "Tyre Callback Customer",
        phoneNumber: mobileNumber,
        email: attributes.email,
        postcode,
        vehicleReg: regNumber ? regNumber : undefined,
        type: "callback",
      });

      resultRecord = await CallbackRequest.findOneAndUpdate(
        { externalId, sourceSystem: "strapi" },
        {
          $setOnInsert: {
            referenceId,
          },
          customer: customer._id,
          mobileNumber,
          postcode,
          regNumber: regNumber || undefined,
          width: attributes.width,
          height: attributes.height,
          diameter: attributes.diameter,
          brand: attributes.brand,
          season: attributes.Season || attributes.season,
          title: attributes.title || "Tyre Finder Callback Request",
          notes: attributes.notes,
          status: "pending",
          sourcePage: "/find-tyres",
          source: "website",
          sourceSystem: "strapi",
          externalId,
          eventId,
          receivedAt,
          idempotencyKey: attributes.idempotencyKey || `strapi_${externalId}`,
        },
        { upsert: true, new: true }
      );
    } else {
      return NextResponse.json(
        { error: `Unsupported submission type: ${type}` },
        { status: 400 }
      );
    }

    // 7. Record Business Event in Outbox & notify active dashboards
    await recordBusinessEvent({
      eventId,
      eventType: businessEventType,
      entityType,
      entityId: resultRecord._id.toString(),
      source: "strapi",
      payload: {
        referenceId: resultRecord.referenceId,
        customerName: resultRecord.customerName || resultRecord.fullName,
        serviceType: resultRecord.serviceType || resultRecord.serviceRequired || resultRecord.title,
        postcode: resultRecord.postcode,
        status: resultRecord.status,
        externalId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${type} from Strapi`,
      recordId: resultRecord._id.toString(),
      referenceId: resultRecord.referenceId,
      externalId,
    });
  } catch (err: any) {
    console.error(`[Strapi Webhook Ingestion Error] Event: ${eventId}:`, err?.message || err);

    await StrapiWebhookLog.findOneAndUpdate(
      { eventId },
      {
        status: "failed",
        errorMessage: err?.message || String(err),
      }
    );

    return NextResponse.json(
      { error: "Failed to persist submission into CRM database", details: err?.message },
      { status: 500 }
    );
  }
}
