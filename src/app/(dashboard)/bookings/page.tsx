import React from "react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { BookmarkCheck } from "lucide-react";

export default function BookingsPage() {
  return (
    <ModulePlaceholder
      title="Bookings Archive & History"
      badge="Audit & Records"
      description="Historical log of all confirmed, completed, and cancelled tyre fittings with audit trails."
      databaseModel="Appointment / Booking (MongoDB Collection: appointments)"
      icon={BookmarkCheck}
      plannedFeatures={[
        "Complete historical booking archive with full-text search",
        "Revenue and invoice reconciliation for completed jobs",
        "Filter by date range, postcode region, service type, and technician",
        "Detailed timeline log of appointment status changes and operator actions",
        "Exportable financial summaries and job completion certificates",
        "Historical tyre replacement trend analysis",
      ]}
    />
  );
}
