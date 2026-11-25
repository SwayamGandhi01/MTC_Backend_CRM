import mongoose, { Schema, Document, Model } from "mongoose";

export type EnquiryStatus = "new" | "contacted" | "quoted" | "converted" | "closed";

export interface IEnquiryStatusHistory {
  status: EnquiryStatus;
  changedBy: string;
  timestamp: Date;
  notes?: string;
}

export interface IEnquiry extends Document {
  referenceId: string;
  customer?: mongoose.Types.ObjectId;
  fullName: string;
  email?: string;
  phoneNumber: string;
  postcode: string;
  vehicleReg?: string;
  serviceRequired: string;
  tyreSize?: string;
  message: string;
  status: EnquiryStatus;
  assignedTo?: mongoose.Types.ObjectId;
  notes?: string;
  sourcePage?: string;
  source?: string;
  sourceSystem?: string;
  externalId?: string;
  eventId?: string;
  receivedAt?: Date;
  statusHistory: IEnquiryStatusHistory[];
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EnquiryStatusHistorySchema = new Schema<IEnquiryStatusHistory>(
  {
    status: { type: String, required: true },
    changedBy: { type: String, required: true, default: "system" },
    timestamp: { type: Date, required: true, default: Date.now },
    notes: { type: String },
  },
  { _id: false }
);

const EnquirySchema = new Schema<IEnquiry>(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
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
    vehicleReg: {
      type: String,
      uppercase: true,
      trim: true,
    },
    serviceRequired: {
      type: String,
      required: [true, "Service required is required"],
      trim: true,
      index: true,
    },
    tyreSize: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "quoted", "converted", "closed"],
      default: "new",
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
    notes: {
      type: String,
    },
    sourcePage: {
      type: String,
      default: "/contact",
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
      type: [EnquiryStatusHistorySchema],
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

EnquirySchema.index({ createdAt: -1, status: 1 });

export const Enquiry: Model<IEnquiry> =
  mongoose.models.Enquiry || mongoose.model<IEnquiry>("Enquiry", EnquirySchema);

export default Enquiry;
