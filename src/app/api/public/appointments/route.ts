import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Appointment } from "@/models/Appointment";
import { findOrCreateCustomer, generateReferenceId } from "@/lib/db/customer-helper";
import { publicAppointmentSchema } from "@/lib/validations/intake";
import { handleOptions, publicSuccess, publicError, checkRateLimit } from "@/lib/api/public-helper";

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";

    if (!checkRateLimit(ip)) {
      return publicError("Too many submission requests. Please wait a few minutes before trying again.", 429);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return publicError("Malformed JSON request body.", 400);
    }

    // Support both direct payload and Strapi-wrapped payload ({ data: { ... } })
    const payload = body?.data ? body.data : body;

    // Check honeypot spam trap
    if (payload?.honeypot) {
      return publicSuccess({
        message: "Appointment received successfully.",
        submissionId: "MTC-APT-SPAMTRAP",
      });
    }

    const parseResult = publicAppointmentSchema.safeParse(payload);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const err of parseResult.error.errors) {
        const fieldName = err.path.join(".");
        fieldErrors[fieldName] = err.message;
      }
      return publicError(parseResult.error.errors[0]?.message || "Validation failed.", 422, fieldErrors);
    }

    const validData = parseResult.data;

    await connectToDatabase();

    // Idempotency check: if an idempotency key was supplied, check for existing submission
    if (validData.idempotencyKey) {
      const existing = await Appointment.findOne({ idempotencyKey: validData.idempotencyKey });
      if (existing) {
        return publicSuccess({
          message: "Appointment already received.",
          submissionId: existing.referenceId,
          referenceId: existing.referenceId,
          status: existing.status,
        });
      }
    }

    // Find or create customer record (linking history without creating duplicates)
    const customer = await findOrCreateCustomer({
      fullName: validData.fullName,
      phoneNumber: validData.phoneNumber,
      email: validData.email || undefined,
      postcode: validData.postcode,
      vehicleReg: validData.vehicleReg,
      address: validData.address || validData.town,
      type: "booking",
    });

    const referenceId = generateReferenceId("APT");

    const newAppointment = new Appointment({
      referenceId,
      bookingRef: referenceId,
      customer: customer._id,
      customerName: validData.fullName,
      customerPhone: validData.phoneNumber,
      customerEmail: validData.email || undefined,
      vehicleReg: validData.vehicleReg,
      postcode: validData.postcode,
      address: validData.address || validData.town,
      town: validData.town,
      locationNotes: validData.locationNotes,
      latitude: validData.latitude || undefined,
      longitude: validData.longitude || undefined,
      serviceType: validData.serviceType,
      tyreSize: validData.tyreSize,
      timingSlot: validData.timingSlot,
      bookingDate: new Date(),
      status: "pending",
      paymentStatus: "pending",
      sourcePage: validData.sourcePage,
      statusHistory: [
        {
          status: "pending",
          changedBy: "Customer Web Submission",
          timestamp: new Date(),
          notes: `Submitted via website from ${validData.sourcePage || "/booking"}`,
        },
      ],
      idempotencyKey: validData.idempotencyKey,
    });

    await newAppointment.save();

    return publicSuccess(
      {
        message: "Appointment submitted successfully! Our dispatch team will contact you shortly.",
        submissionId: referenceId,
        referenceId,
        data: {
          referenceId,
          customerName: newAppointment.customerName,
          vehicleReg: newAppointment.vehicleReg,
          status: newAppointment.status,
          createdAt: newAppointment.createdAt,
        },
      },
      201
    );
  } catch (error: any) {
    console.error("[Public API] Appointment submission error:", error.message);
    return publicError("Failed to submit appointment. Please try again or call our 24/7 hotline directly.", 500);
  }
}
