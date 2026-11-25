import React from "react";
import { Badge } from "@/components/ui/badge";
import { BookingStatus } from "@/types/appointment";

interface StatusBadgeProps {
  status: BookingStatus | string;
  isEmergency?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isEmergency }) => {
  if (isEmergency) {
    return (
      <Badge variant="emergency" className="gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
        Emergency
      </Badge>
    );
  }

  const raw = String(status || "").trim();
  const lower = raw.toLowerCase();

  if (lower === "pending" || lower === "new") {
    return <Badge variant="pending">Pending</Badge>;
  }
  if (lower === "approved" || lower === "confirmed" || lower === "booked") {
    return <Badge variant="approved">Confirmed</Badge>;
  }
  if (lower === "in_progress" || lower === "in progress" || lower === "assigned" || lower === "called") {
    return <Badge variant="progress">In Progress</Badge>;
  }
  if (lower === "completed" || lower === "converted") {
    return <Badge variant="completed">Completed</Badge>;
  }
  if (lower === "rejected" || lower === "cancelled" || lower === "closed") {
    return <Badge variant="rejected">Cancelled</Badge>;
  }

  return <Badge variant="default">{raw || "Standard"}</Badge>;
};
