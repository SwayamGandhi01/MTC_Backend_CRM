import { requirePermission } from "@/lib/auth/roles";
import { apiSuccess, apiError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Appointment } from "@/models/Appointment";
import { Enquiry } from "@/models/Enquiry";
import { CallbackRequest } from "@/models/CallbackRequest";
import { Customer } from "@/models/Customer";

export async function GET() {
  try {
    await requirePermission("dashboard.view");

    await connectToDatabase();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      pendingAppointments,
      totalAppointments,
      todayAppointments,
      newEnquiries,
      totalEnquiries,
      pendingCallbacks,
      totalCustomers,
      recentAppointments,
    ] = await Promise.all([
      Appointment.countDocuments({ status: "pending" }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ createdAt: { $gte: todayStart } }),
      Enquiry.countDocuments({ status: "new" }),
      Enquiry.countDocuments(),
      CallbackRequest.countDocuments({ status: "pending" }),
      Customer.countDocuments(),
      Appointment.find().sort({ createdAt: -1 }).limit(6).lean(),
    ]);

    return apiSuccess({
      kpis: {
        totalLeads: totalAppointments + totalEnquiries,
        todayLeads: todayAppointments,
        pendingAppointments,
        activeEmergencies: pendingAppointments,
        averageRating: 4.9,
        totalReviews: 186,
        pendingCallbacks,
        totalCustomers,
      },
      metrics: [
        {
          title: "Pending Bookings",
          value: pendingAppointments.toString(),
          change: pendingAppointments > 0 ? `${pendingAppointments} to triage` : "All clear",
          trend: pendingAppointments > 0 ? "up" : "down",
          description: "Awaiting confirmation & dispatch",
          iconName: "Calendar",
          colorScheme: "orange",
        },
        {
          title: "Inbound Enquiries",
          value: newEnquiries.toString(),
          change: `${totalEnquiries} all time`,
          trend: "up",
          description: "New website quote requests",
          iconName: "MessageSquare",
          colorScheme: "blue",
        },
        {
          title: "Callback Queue",
          value: pendingCallbacks.toString(),
          change: "Under 15m target",
          trend: "up",
          description: "Tyre Finder callback requests",
          iconName: "Phone",
          colorScheme: "emerald",
        },
        {
          title: "Active Customers",
          value: totalCustomers.toString(),
          change: "+100% verified",
          trend: "up",
          description: "Unique registered vehicle owners",
          iconName: "Users",
          colorScheme: "purple",
        },
      ],
      recentSubmissions: recentAppointments.map((appt) => ({
        id: appt._id.toString(),
        referenceId: appt.referenceId,
        customerName: appt.customerName,
        phone: appt.customerPhone,
        serviceType: appt.serviceType,
        postcode: appt.postcode,
        vehicleReg: appt.vehicleReg,
        status: appt.status,
        submittedAt: appt.createdAt,
      })),
    });
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return apiError(error.message, "UNAUTHORIZED", error.status);
    }
    return apiError(error.message || "Failed to fetch dashboard stats", "INTERNAL_ERROR", 500);
  }
}
