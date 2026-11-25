import mongoose, { Schema, Document, Model } from "mongoose";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "partial" | "refunded";

export interface IStatusHistoryItem {
  status: AppointmentStatus;
  changedBy: string;
  timestamp: Date;
  notes?: string;
}

export interface IAppointment extends Document {
  referenceId: string;
  bookingRef: string;
  customer?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleReg: string;
  postcode: string;
  address?: string;
  town?: string;
  locationNotes?: string;
  latitude?: number;
  longitude?: number;
  serviceType: string;
  tyreSize?: string;
  tyreQuantity: number;
  tyreBrandPreference?: string;
  timingSlot: string;
  bookingDate: Date;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  technicianId?: mongoose.Types.ObjectId;
  technicianName?: string;
  priceQuote?: number;
  notes?: string;
  sourcePage?: string;
  source?: string;
  sourceSystem?: string;
  externalId?: string;
  eventId?: string;
  receivedAt?: Date;
  statusHistory: IStatusHistoryItem[];
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema<IStatusHistoryItem>(
  {
    status: { type: String, required: true },
    changedBy: { type: String, required: true, default: "system" },
    timestamp: { type: Date, required: true, default: Date.now },
    notes: { type: String },
  },
  { _id: false }
);

const AppointmentSchema = new Schema<IAppointment>(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    bookingRef: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      index: true,
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      index: true,
    },
    customerPhone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      index: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    vehicleReg: {
      type: String,
      required: [true, "Vehicle registration is required"],
      uppercase: true,
      trim: true,
      index: true,
    },
    postcode: {
      type: String,
      required: [true, "Postcode is required"],
      uppercase: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
    },
    town: {
      type: String,
      trim: true,
    },
    locationNotes: {
      type: String,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    serviceType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tyreSize: {
      type: String,
      trim: true,
    },
    tyreQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    tyreBrandPreference: {
      type: String,
      trim: true,
    },
    timingSlot: {
      type: String,
      required: true,
      trim: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "assigned", "in_progress", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "partial", "refunded"],
      default: "pending",
      index: true,
    },
    technicianId: {
      type: Schema.Types.ObjectId,
      ref: "Technician",
      index: true,
    },
    technicianName: {
      type: String,
      trim: true,
    },
    priceQuote: {
      type: Number,
    },
    notes: {
      type: String,
    },
    sourcePage: {
      type: String,
      default: "/booking",
    },
    source: {
      type: String,
      default: "crm",
      index: true,
    },
    sourceSystem: {
      type: String,
      default: "crm",
      index: true,
    },
    externalId: {
      type: String,
      sparse: true,
      index: true,
    },
    eventId: {
      type: String,
      sparse: true,
      index: true,
    },
    receivedAt: {
      type: Date,
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
    idempotencyKey: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

AppointmentSchema.index({ createdAt: -1 });
AppointmentSchema.index({ bookingDate: -1, status: 1 });
AppointmentSchema.index({ customerPhone: 1, vehicleReg: 1 });

export const Appointment: Model<IAppointment> =
  mongoose.models.Appointment || mongoose.model<IAppointment>("Appointment", AppointmentSchema);

export default Appointment;
