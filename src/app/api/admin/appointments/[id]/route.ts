import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Appointment } from "@/models/Appointment";
import { requirePermission } from "@/lib/auth/roles";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("appointments.view");

    const { id } = await params;
    await connectToDatabase();

    const appointment = await Appointment.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { referenceId: id }],
    })
      .populate("customer")
      .lean();

    if (!appointment) {
      return apiError("Appointment not found", "NOT_FOUND", 404);
    }

    return apiSuccess(appointment);
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch appointment", "SERVER_ERROR", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await requirePermission("appointments.update");

    const { id } = await params;
    const body = await request.json();

    await connectToDatabase();

    const appointment = await Appointment.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { referenceId: id }],
    });

    if (!appointment) {
      return apiError("Appointment not found", "NOT_FOUND", 404);
    }

    const previousStatus = appointment.status;

    // Handle status transition
    if (body.status && body.status !== previousStatus) {
      const allowedStatuses = [
        "pending",
        "confirmed",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ];
      if (!allowedStatuses.includes(body.status)) {
        return apiError("Invalid appointment status value", "INVALID_STATUS", 422);
      }

      appointment.status = body.status;
      appointment.statusHistory.push({
        status: body.status,
        changedBy: authContext.user.name || authContext.user.email || "Admin User",
        timestamp: new Date(),
        notes: body.notes || `Status transitioned from ${previousStatus} to ${body.status}`,
      });
    }

    if (body.technicianName !== undefined) {
      appointment.technicianName = body.technicianName;
    }

    if (body.technicianId !== undefined) {
      appointment.technicianId = body.technicianId;
    }

    if (body.priceQuote !== undefined) {
      appointment.priceQuote = Number(body.priceQuote);
    }

    if (body.paymentStatus !== undefined) {
      appointment.paymentStatus = body.paymentStatus;
    }

    if (body.notes !== undefined) {
      appointment.notes = body.notes;
    }

    await appointment.save();

    return apiSuccess(appointment, { message: "Appointment updated successfully" });
  } catch (error: any) {
    return apiError(error.message || "Failed to update appointment", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("appointments.delete");
    const { id } = await params;

    await connectToDatabase();
    const result = await Appointment.deleteOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { referenceId: id }],
    });

    if (result.deletedCount === 0) {
      return apiError("Appointment not found", "NOT_FOUND", 404);
    }

    return apiSuccess({ deleted: true }, { message: "Appointment deleted successfully" });
  } catch (error: any) {
    return apiError(error.message || "Failed to delete appointment", "SERVER_ERROR", error.status || 500);
  }
}
