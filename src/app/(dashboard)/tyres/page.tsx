import React from "react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Disc } from "lucide-react";

export default function TyresPage() {
  return (
    <ModulePlaceholder
      title="Tyre Catalog & Stock Management"
      badge="Catalog & Inventory"
      description="Manage supported tyre dimensions, brand profiles (Budget, Mid-Range, Premium), speed ratings, and stock status."
      databaseModel="TyreCatalog (MongoDB Collection: tyres)"
      icon={Disc}
      plannedFeatures={[
        "Universal tyre size search matrix (Width, Profile, Rim Size, Speed/Load Index)",
        "Brand tier management (Budget, Mid-Range, Premium: Michelin, Continental, Pirelli, Goodyear)",
        "Van inventory stock level tracker and minimum reorder alert triggers",
        "Vehicle registration number to tyre size lookup cache",
        "Supplier price book importer and margin calculator",
        "Seasonal tyre tagging (Summer, Winter, All-Season, Run-Flat)",
      ]}
    />
  );
}
