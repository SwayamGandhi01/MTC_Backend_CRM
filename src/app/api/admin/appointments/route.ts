import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Appointment } from "@/models/Appointment";
import { requirePermission } from "@/lib/auth/roles";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("appointments.view");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const serviceType = searchParams.get("serviceType");

    await connectToDatabase();

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (serviceType && serviceType !== "all") {
      query.serviceType = serviceType;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { referenceId: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { vehicleReg: searchRegex },
        { postcode: searchRegex },
      ];
    }

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return apiSuccess(appointments, {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return apiError(error.message, "AUTH_RESTRICTED", error.status);
    }
    console.error("[Admin API] Failed to fetch appointments:", error);
    return apiError(error.message || "Failed to fetch appointments", "SERVER_ERROR", 500);
  }
}
