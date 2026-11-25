import React from "react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Mail } from "lucide-react";

export default function EmailsPage() {
  return (
    <ModulePlaceholder
      title="Email Logs & Communications"
      badge="Transactional"
      description="Transactional email dispatch logs, customer notifications, and Resend delivery analytics."
      databaseModel="EmailLog (MongoDB Collection: email_logs)"
      icon={Mail}
      plannedFeatures={[
        "Outbound email delivery log with timestamp, recipient, subject, and delivery status",
        "HTML email preview and template inspector (Appointment Confirmation, Technician En Route, Quote Ready)",
        "Resend webhook integration for real-time delivery, bounce, and open rate tracking",
        "Manual re-send action for failed notifications or customer receipt requests",
        "Direct email composition with pre-approved customer communication templates",
        "Postcode and dispatch notification rules",
      ]}
    />
  );
}
