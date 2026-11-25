import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AvailabilityRequest } from "@/models/AvailabilityRequest";
import { requirePermission } from "@/lib/auth/roles";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("availability.view");

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));

    await connectToDatabase();

    const [recentChecks, totalChecks, supportedCount, unsupportedCount] = await Promise.all([
      AvailabilityRequest.find().sort({ createdAt: -1 }).limit(limit).lean(),
      AvailabilityRequest.countDocuments(),
      AvailabilityRequest.countDocuments({ status: "supported" }),
      AvailabilityRequest.countDocuments({ status: "unsupported" }),
    ]);

    return apiSuccess({
      recentChecks,
      stats: {
        totalChecks,
        supportedCount,
        unsupportedCount,
        coverageRate: totalChecks > 0 ? ((supportedCount / totalChecks) * 100).toFixed(1) + "%" : "0%",
      },
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch availability checks", "SERVER_ERROR", 500);
  }
}
