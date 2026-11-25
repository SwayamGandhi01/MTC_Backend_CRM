import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { CallbackRequest } from "@/models/CallbackRequest";
import { requirePermission } from "@/lib/auth/roles";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("enquiries.view");

    const { id } = await params;
    await connectToDatabase();

    const callback = await CallbackRequest.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { referenceId: id }],
    })
      .populate("customer")
      .lean();

    if (!callback) {
      return apiError("Callback request not found", "NOT_FOUND", 404);
    }

    return apiSuccess(callback);
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch callback", "SERVER_ERROR", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await requirePermission("enquiries.update");

    const { id } = await params;
    const body = await request.json();

    await connectToDatabase();

    const callback = await CallbackRequest.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { referenceId: id }],
    });

    if (!callback) {
      return apiError("Callback request not found", "NOT_FOUND", 404);
    }

    const previousStatus = callback.status;

    if (body.status && body.status !== previousStatus) {
      callback.status = body.status;
      callback.statusHistory.push({
        status: body.status,
        changedBy: authContext.user.name || authContext.user.email || "Admin User",
        timestamp: new Date(),
        notes: body.notes || `Callback status changed from ${previousStatus} to ${body.status}`,
      });
    }

    if (body.notes !== undefined) {
      callback.notes = body.notes;
    }

    await callback.save();

    return apiSuccess(callback, { message: "Callback updated successfully" });
  } catch (error: any) {
    return apiError(error.message || "Failed to update callback", "SERVER_ERROR", 500);
  }
}
