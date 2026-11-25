import React from "react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Image as ImageIcon } from "lucide-react";

export default function GalleryPage() {
  return (
    <ModulePlaceholder
      title="Fittings Gallery & Showcase"
      badge="Media Management"
      description="Upload, categorize, and showcase genuine roadside tyre fitting job photos and vehicle transformations."
      databaseModel="GalleryItem (MongoDB Collection: gallery_items)"
      icon={ImageIcon}
      plannedFeatures={[
        "Drag-and-drop job photo uploader with client-side image compression",
        "Tagging by vehicle brand, tyre model, and service location",
        "Before/after puncture and fitting photo comparison gallery",
        "Customer consent and license plate blur verification before publishing",
        "Media CDN storage with automatic WebP / AVIF transformation",
        "Direct embed selector for website case studies and social channels",
      ]}
    />
  );
}
