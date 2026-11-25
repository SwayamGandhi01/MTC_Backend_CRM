import React from "react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="System & CRM Settings"
      badge="Administration"
      description="Configure core business parameters, operating hours, notification webhooks, and database health."
      databaseModel="WebsiteSetting / SystemConfig (MongoDB Collection: system_configs)"
      icon={Settings}
      plannedFeatures={[
        "Business contact details, VAT registration, and operating address settings",
        "Standard operating hours and 24/7 emergency dispatch toggles",
        "Transactional email provider setup (Resend API credentials & verified sender domain)",
        "Database connection status and MongoDB Atlas replica set health monitor",
        "Automated backup triggers and data retention policy configurations",
        "Audit log export for regulatory and compliance inspection",
      ]}
    />
  );
}
