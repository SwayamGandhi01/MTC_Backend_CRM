import React from "react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Truck } from "lucide-react";

export default function TechniciansPage() {
  return (
    <ModulePlaceholder
      title="Technicians & Mobile Vans"
      badge="Fleet & Dispatch"
      description="Manage mobile tyre technicians, mobile van assignments, operating zones, and schedule availability."
      databaseModel="Technician (MongoDB Collection: technicians)"
      icon={Truck}
      plannedFeatures={[
        "Technician roster with contact details, shift schedules, and operational status",
        "Mobile van allocation with onboard equipment and inventory tracking",
        "Active job assignment and real-time status dispatch",
        "Coverage zone assignment (Surrey Central, Surrey South, Hampshire North, Berkshire East)",
        "Daily performance metrics (completed fittings, response times, customer rating)",
        "Emergency roadside on-call rota management",
      ]}
    />
  );
}
