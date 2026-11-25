import React from "react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Star } from "lucide-react";

export default function ReviewsPage() {
  return (
    <ModulePlaceholder
      title="Google Reviews & Testimonials"
      badge="Reputation"
      description="Synchronize Google Business profile reviews, spotlight top customer feedback, and trigger post-job reviews."
      databaseModel="Review (MongoDB Collection: reviews)"
      icon={Star}
      plannedFeatures={[
        "Automated Google Places API review synchronization",
        "Website testimonial curation (featured badge, verified customer tag)",
        "Customer satisfaction rating breakdown (overall 4.9/5 score tracking)",
        "Post-service automated review request SMS/email workflow triggers",
        "Review reply drafting and response tracker",
        "Flagged feedback resolution tracker for customer service recovery",
      ]}
    />
  );
}
