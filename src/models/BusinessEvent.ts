import mongoose, { Schema, Document, Model } from "mongoose";

export type BusinessEventType =
  | "appointment.created"
  | "appointment.updated"
  | "appointment.status_changed"
  | "enquiry.created"
  | "callback.created"
  | "customer.created"
  | "customer.updated"
  | "emergency_request.created"
  | "booking.archived"
  | "technician.status_changed";

export type EventEntityType = "appointment" | "enquiry" | "callback" | "customer" | "user";

export interface IBusinessEvent extends Document {
  eventId: string;
  eventType: BusinessEventType | string;
  entityType: EventEntityType;
  entityId: string;
  source: "strapi" | "crm" | "website";
  payload: Record<string, any>;
  status: "pending" | "processed" | "failed";
  attempts: number;
  processedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessEventSchema = new Schema<IBusinessEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["appointment", "enquiry", "callback", "customer", "user"],
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
      enum: ["strapi", "crm", "website"],
      default: "crm",
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "processed", "failed"],
      default: "pending",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    processedAt: {
      type: Date,
    },
    lastError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

BusinessEventSchema.index({ status: 1, createdAt: 1 });
BusinessEventSchema.index({ entityType: 1, entityId: 1 });

export const BusinessEvent: Model<IBusinessEvent> =
  mongoose.models.BusinessEvent ||
  mongoose.model<IBusinessEvent>("BusinessEvent", BusinessEventSchema);

export default BusinessEvent;
