export type BookingStatus =
  | "Pending"
  | "Approved"
  | "In Progress"
  | "Completed"
  | "Rejected"
  | "Cancelled";

export type ServiceType =
  | "Mobile Tyre Fitting"
  | "Emergency Tyre Fitting"
  | "Puncture Repair"
  | "Locking Wheel Nut Removal"
  | "Mobile Trailer Tyre Fitting"
  | "Precision Wheel Balancing"
  | "Premium Tyre Service";

export interface AppointmentRecord {
  id: string | number;
  documentId?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  serviceType: ServiceType;
  tyreSize: string;
  timingSlot: string;
  bookingStatus: BookingStatus;
  postcode: string;
  address: string;
  vehicleReg: string;
  locationNotes?: string;
  createdAt: string;
  assignedTechnician?: string;
  priceEstimate?: number;
}

export interface EnquiryRecord {
  id: string | number;
  fullName: string;
  phoneNumber: string;
  email?: string;
  postcode: string;
  serviceRequired: string;
  message: string;
  status: "Pending" | "Responded" | "Closed";
  createdAt: string;
}
