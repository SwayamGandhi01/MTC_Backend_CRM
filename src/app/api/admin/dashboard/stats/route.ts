import { requirePermission } from "@/lib/auth/roles";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getDashboardOverviewData } from "@/lib/services/dashboard.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/dashboard/stats
 * 
 * Returns real-time authoritative metrics from MongoDB Atlas.
 * Shared logic with the server-side dashboard loader.
 */
export async function GET() {
  try {
    await requirePermission("dashboard.view");
    const data = await getDashboardOverviewData();
    return apiSuccess(data);
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return apiError(error.message, "UNAUTHORIZED", error.status);
    }
    console.error("[Dashboard API Error]", error?.message || error);
    return apiError(
      error.message || "Failed to fetch real-time dashboard statistics",
      "INTERNAL_ERROR",
      500
    );
  }
}
