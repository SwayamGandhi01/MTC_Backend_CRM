import React from "react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { MapPin } from "lucide-react";

export default function LocationsPage() {
  return (
    <ModulePlaceholder
      title="Coverage Locations & Zones"
      badge="Geographic Operations"
      description="Define operating coverage zones, postal district boundaries, callout travel fees, and service hubs."
      databaseModel="Location (MongoDB Collection: locations)"
      icon={MapPin}
      plannedFeatures={[
        "Postal code prefix validator (GU, RG, SL, TW, KT, RH districts)",
        "Tiered emergency travel fee calculator by radial mileage from hub",
        "Town and locality landing page generator with dedicated SEO tags",
        "Active service status toggling per postal sector for weather/capacity constraints",
        "Interactive coverage radius map with active mobile van pins",
        "Zone-based dispatcher routing rules",
      ]}
    />
  );
}
