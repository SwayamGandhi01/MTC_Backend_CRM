import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Customer } from "@/models/Customer";
import { Appointment } from "@/models/Appointment";
import { Enquiry } from "@/models/Enquiry";
import { CallbackRequest } from "@/models/CallbackRequest";
import { requirePermission } from "@/lib/auth/roles";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("customers.view");

    const { id } = await params;
    await connectToDatabase();

    const customer = await Customer.findById(id).lean();

    if (!customer) {
      return apiError("Customer not found", "NOT_FOUND", 404);
    }

    // Retrieve associated submissions history across all forms
    const [appointments, enquiries, callbacks] = await Promise.all([
      Appointment.find({ customer: customer._id }).sort({ createdAt: -1 }).lean(),
      Enquiry.find({ customer: customer._id }).sort({ createdAt: -1 }).lean(),
      CallbackRequest.find({ customer: customer._id }).sort({ createdAt: -1 }).lean(),
    ]);

    return apiSuccess({
      customer,
      history: {
        appointments,
        enquiries,
        callbacks,
      },
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch customer history", "SERVER_ERROR", 500);
  }
}
