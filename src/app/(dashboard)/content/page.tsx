import React from "react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { FileText } from "lucide-react";

export default function ContentPage() {
  return (
    <ModulePlaceholder
      title="Website Content Management"
      badge="Publishing"
      description="Control homepage banners, emergency announcement notices, SEO meta tags, and FAQ content."
      databaseModel="WebsiteSetting / ContentBlock (MongoDB Collection: website_settings)"
      icon={FileText}
      plannedFeatures={[
        "Emergency roadside warning bar toggle and dynamic announcement message",
        "Homepage hero value propositions and operating hours editor",
        "SEO metadata editor (titles, descriptions, OpenGraph social preview images)",
        "Frequently Asked Questions (FAQ) reordering and CRUD manager",
        "Brand assets and promotional campaign banner updates",
        "Instant cache invalidation on save",
      ]}
    />
  );
}
