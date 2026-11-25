import mongoose, { Schema, Document, Model } from "mongoose";

export type CallbackStatus = "pending" | "called" | "booked" | "no_answer" | "closed";

export interface ICallbackStatusHistory {
  status: CallbackStatus;
  changedBy: string;
  timestamp: Date;
  notes?: string;
}

export interface ICallbackRequest extends Document {
  referenceId: string;
  customer?: mongoose.Types.ObjectId;
  mobileNumber: string;
  postcode: string;
  regNumber?: string;
  width?: string;
  height?: string;
  diameter?: string;
  brand?: string;
  season?: string;
  title?: string;
  notes?: string;
  status: CallbackStatus;
  sourcePage?: string;
  statusHistory: ICallbackStatusHistory[];
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CallbackStatusHistorySchema = new Schema<ICallbackStatusHistory>(
  {
    status: { type: String, required: true },
    changedBy: { type: String, required: true, default: "system" },
    timestamp: { type: Date, required: true, default: Date.now },
    notes: { type: String },
  },
  { _id: false }
);

const CallbackRequestSchema = new Schema<ICallbackRequest>(
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
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
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
    regNumber: {
      type: String,
      uppercase: true,
      trim: true,
      index: true,
    },
    width: {
      type: String,
      trim: true,
    },
    height: {
      type: String,
      trim: true,
    },
    diameter: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    season: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "called", "booked", "no_answer", "closed"],
      default: "pending",
      index: true,
    },
    sourcePage: {
      type: String,
      default: "/find-tyres",
    },
    statusHistory: {
      type: [CallbackStatusHistorySchema],
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

CallbackRequestSchema.index({ createdAt: -1, status: 1 });

export const CallbackRequest: Model<ICallbackRequest> =
  mongoose.models.CallbackRequest ||
  mongoose.model<ICallbackRequest>("CallbackRequest", CallbackRequestSchema);

export default CallbackRequest;
