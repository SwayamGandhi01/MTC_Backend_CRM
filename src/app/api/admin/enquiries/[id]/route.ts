import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Enquiry } from "@/models/Enquiry";
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

    const enquiry = await Enquiry.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { referenceId: id }],
    })
      .populate("customer")
      .lean();

    if (!enquiry) {
      return apiError("Enquiry not found", "NOT_FOUND", 404);
    }

    return apiSuccess(enquiry);
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch enquiry", "SERVER_ERROR", 500);
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

    const enquiry = await Enquiry.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { referenceId: id }],
    });

    if (!enquiry) {
      return apiError("Enquiry not found", "NOT_FOUND", 404);
    }

    const previousStatus = enquiry.status;

    if (body.status && body.status !== previousStatus) {
      enquiry.status = body.status;
      enquiry.statusHistory.push({
        status: body.status,
        changedBy: authContext.user.name || authContext.user.email || "Admin User",
        timestamp: new Date(),
        notes: body.notes || `Status changed from ${previousStatus} to ${body.status}`,
      });
    }

    if (body.notes !== undefined) {
      enquiry.notes = body.notes;
    }

    await enquiry.save();

    return apiSuccess(enquiry, { message: "Enquiry updated successfully" });
  } catch (error: any) {
    return apiError(error.message || "Failed to update enquiry", "SERVER_ERROR", 500);
  }
}
