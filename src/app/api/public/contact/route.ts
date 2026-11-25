import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Enquiry } from "@/models/Enquiry";
import { findOrCreateCustomer, generateReferenceId } from "@/lib/db/customer-helper";
import { publicContactSchema } from "@/lib/validations/intake";
import { handleOptions, publicSuccess, publicError, checkRateLimit } from "@/lib/api/public-helper";

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";

    if (!checkRateLimit(ip)) {
      return publicError("Too many contact requests. Please wait a few minutes before trying again.", 429);
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
        message: "Enquiry received successfully.",
        submissionId: "MTC-ENQ-SPAMTRAP",
      });
    }

    const parseResult = publicContactSchema.safeParse(payload);
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

    // Idempotency check
    if (validData.idempotencyKey) {
      const existing = await Enquiry.findOne({ idempotencyKey: validData.idempotencyKey });
      if (existing) {
        return publicSuccess({
          message: "Enquiry already received.",
          submissionId: existing.referenceId,
          referenceId: existing.referenceId,
          status: existing.status,
        });
      }
    }

    // Link or create customer record
    const customer = await findOrCreateCustomer({
      fullName: validData.fullName,
      phoneNumber: validData.phoneNumber,
      email: validData.email || undefined,
      postcode: validData.postcode,
      vehicleReg: validData.vehicleReg || undefined,
      type: "enquiry",
    });

    const referenceId = generateReferenceId("ENQ");

    const newEnquiry = new Enquiry({
      referenceId,
      customer: customer._id,
      fullName: validData.fullName,
      phoneNumber: validData.phoneNumber,
      email: validData.email || undefined,
      postcode: validData.postcode,
      serviceRequired: validData.serviceRequired,
      message: validData.message,
      vehicleReg: validData.vehicleReg || undefined,
      status: "new",
      sourcePage: validData.sourcePage,
      statusHistory: [
        {
          status: "new",
          changedBy: "Customer Contact Submission",
          timestamp: new Date(),
          notes: `Inquiry submitted from ${validData.sourcePage || "/contact"}`,
        },
      ],
      idempotencyKey: validData.idempotencyKey,
    });

    await newEnquiry.save();

    return publicSuccess(
      {
        message: "Thank you for reaching out! Our expert dispatch team will contact you shortly.",
        submissionId: referenceId,
        referenceId,
        data: {
          referenceId,
          fullName: newEnquiry.fullName,
          serviceRequired: newEnquiry.serviceRequired,
          status: newEnquiry.status,
          createdAt: newEnquiry.createdAt,
        },
      },
      201
    );
  } catch (error: any) {
    console.error("[Public API] Contact submission error:", error.message);
    return publicError("Failed to submit contact enquiry. Please try again or call us directly.", 500);
  }
}
