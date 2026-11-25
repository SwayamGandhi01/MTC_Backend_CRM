import React from "react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Wrench } from "lucide-react";

export default function ServicesPage() {
  return (
    <ModulePlaceholder
      title="Services & Pricing Catalog"
      badge="Catalog"
      description="Manage tyre fitting services, puncture repair pricing, emergency callout rates, and service descriptions."
      databaseModel="Service (MongoDB Collection: services)"
      icon={Wrench}
      plannedFeatures={[
        "Service catalog CRUD (Emergency Mobile Fitting, Puncture Repair, Seasonal Swap, Wheel Balancing)",
        "Base callout fees and out-of-hours / weekend surcharge configurator",
        "Rich text service descriptions and customer preparation instructions",
        "Service availability toggles by geographic zone",
        "Estimated duration and technician skill requirements per service",
        "Public service catalog API synchronization",
      ]}
    />
  );
}
