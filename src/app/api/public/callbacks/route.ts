import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { CallbackRequest } from "@/models/CallbackRequest";
import { findOrCreateCustomer, generateReferenceId } from "@/lib/db/customer-helper";
import { publicCallbackSchema } from "@/lib/validations/intake";
import { handleOptions, publicSuccess, publicError, checkRateLimit } from "@/lib/api/public-helper";

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";

    if (!checkRateLimit(ip)) {
      return publicError("Too many callback requests. Please wait a few minutes before trying again.", 429);
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
        message: "Callback request received successfully.",
        submissionId: "MTC-CB-SPAMTRAP",
      });
    }

    // Normalize field variations from TyreFinder form
    const normalizedPayload = {
      ...payload,
      mobileNumber: payload.mobileNumber || payload.phoneNumber || payload.mobile,
      regNumber: payload.regNumber || payload.vehicleReg || payload.reg,
      season: payload.season || payload.Season,
    };

    const parseResult = publicCallbackSchema.safeParse(normalizedPayload);
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
      const existing = await CallbackRequest.findOne({ idempotencyKey: validData.idempotencyKey });
      if (existing) {
        return publicSuccess({
          message: "Callback request already received.",
          submissionId: existing.referenceId,
          referenceId: existing.referenceId,
          status: existing.status,
        });
      }
    }

    // Link or create customer record
    const customer = await findOrCreateCustomer({
      fullName: `Customer (${validData.postcode})`,
      phoneNumber: validData.mobileNumber,
      postcode: validData.postcode,
      vehicleReg: validData.regNumber || undefined,
      type: "callback",
    });

    const referenceId = generateReferenceId("CB");

    const newCallback = new CallbackRequest({
      referenceId,
      customer: customer._id,
      mobileNumber: validData.mobileNumber,
      postcode: validData.postcode,
      regNumber: validData.regNumber,
      width: validData.width || undefined,
      height: validData.height || undefined,
      diameter: validData.diameter || undefined,
      brand: validData.brand || undefined,
      season: validData.season || undefined,
      title: validData.title || undefined,
      notes: validData.notes || undefined,
      status: "pending",
      sourcePage: validData.sourcePage,
      statusHistory: [
        {
          status: "pending",
          changedBy: "Customer Web Submission",
          timestamp: new Date(),
          notes: `Callback requested via Tyre Finder from ${validData.sourcePage || "/find-tyres"}`,
        },
      ],
      idempotencyKey: validData.idempotencyKey,
    });

    await newCallback.save();

    return publicSuccess(
      {
        message: "Callback request confirmed! Our fitting specialist will call you back within 15 minutes.",
        submissionId: referenceId,
        referenceId,
        data: {
          referenceId,
          mobileNumber: newCallback.mobileNumber,
          postcode: newCallback.postcode,
          status: newCallback.status,
          createdAt: newCallback.createdAt,
        },
      },
      201
    );
  } catch (error: any) {
    console.error("[Public API] Callback request submission error:", error.message);
    return publicError("Failed to submit callback request. Please try again or call us directly.", 500);
  }
}
