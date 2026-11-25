import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AvailabilityRequest } from "@/models/AvailabilityRequest";
import { publicAvailabilitySchema } from "@/lib/validations/intake";
import { handleOptions, publicSuccess, publicError } from "@/lib/api/public-helper";

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";

    let body: any;
    try {
      body = await request.json();
    } catch {
      return publicError("Malformed JSON request body.", 400);
    }

    const payload = body?.data ? body.data : body;

    const parseResult = publicAvailabilitySchema.safeParse(payload);
    if (!parseResult.success) {
      return publicError(parseResult.error.errors[0]?.message || "Invalid availability log data.", 422);
    }

    const validData = parseResult.data;

    await connectToDatabase();

    const record = new AvailabilityRequest({
      postcode: validData.postcode,
      status: validData.status,
      message: validData.message,
      area: validData.area,
      county: validData.county,
      hub: validData.hub,
      sourcePage: validData.sourcePage,
      ipAddress: ip,
    });

    await record.save();

    return publicSuccess(
      {
        message: "Availability check logged.",
        id: record._id.toString(),
      },
      201
    );
  } catch (error: any) {
    console.error("[Public API] Availability logging error:", error.message);
    // Don't fail the user flow if analytics logging encounters an error
    return publicSuccess({ message: "Recorded" }, 200);
  }
}
