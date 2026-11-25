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

  switch (status) {
    case "Pending":
      return <Badge variant="pending">Pending</Badge>;
    case "Approved":
      return <Badge variant="approved">Approved</Badge>;
    case "In Progress":
      return <Badge variant="progress">In Progress</Badge>;
    case "Completed":
      return <Badge variant="completed">Completed</Badge>;
    case "Rejected":
    case "Cancelled":
      return <Badge variant="rejected">{status}</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};
