import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { CallbackRequest } from "@/models/CallbackRequest";
import { requirePermission } from "@/lib/auth/roles";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("enquiries.view");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    await connectToDatabase();

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { referenceId: searchRegex },
        { mobileNumber: searchRegex },
        { postcode: searchRegex },
        { regNumber: searchRegex },
        { brand: searchRegex },
      ];
    }

    const total = await CallbackRequest.countDocuments(query);
    const callbacks = await CallbackRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return apiSuccess(callbacks, {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch callbacks", "SERVER_ERROR", 500);
  }
}
