import mongoose, { Schema, Document, Model } from "mongoose";

export type AvailabilityStatus = "supported" | "unsupported" | "invalid" | "incomplete";

export interface IAvailabilityRequest extends Document {
  postcode: string;
  status: AvailabilityStatus;
  message?: string;
  area?: string;
  county?: string;
  hub?: string;
  sourcePage?: string;
  ipAddress?: string;
  createdAt: Date;
}

const AvailabilityRequestSchema = new Schema<IAvailabilityRequest>(
  {
    postcode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["supported", "unsupported", "invalid", "incomplete"],
      required: true,
      index: true,
    },
    message: {
      type: String,
    },
    area: {
      type: String,
      trim: true,
    },
    county: {
      type: String,
      trim: true,
    },
    hub: {
      type: String,
      trim: true,
    },
    sourcePage: {
      type: String,
      default: "/",
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AvailabilityRequestSchema.index({ createdAt: -1 });

export const AvailabilityRequest: Model<IAvailabilityRequest> =
  mongoose.models.AvailabilityRequest ||
  mongoose.model<IAvailabilityRequest>("AvailabilityRequest", AvailabilityRequestSchema);

export default AvailabilityRequest;
