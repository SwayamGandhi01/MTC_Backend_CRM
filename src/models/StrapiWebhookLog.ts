import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStrapiWebhookLog extends Document {
  eventId: string;
  eventType: string;
  externalId: string;
  source: string;
  status: "processed" | "duplicate" | "rejected" | "failed";
  signatureValid: boolean;
  payload: Record<string, any>;
  errorMessage?: string;
  receivedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StrapiWebhookLogSchema = new Schema<IStrapiWebhookLog>(
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
    externalId: {
      type: String,
      required: true,
      index: true,
    },
    source: {
      type: String,
      default: "strapi",
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["processed", "duplicate", "rejected", "failed"],
      index: true,
    },
    signatureValid: {
      type: Boolean,
      required: true,
      default: false,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

StrapiWebhookLogSchema.index({ externalId: 1, eventType: 1 });
StrapiWebhookLogSchema.index({ receivedAt: -1 });

export const StrapiWebhookLog: Model<IStrapiWebhookLog> =
  mongoose.models.StrapiWebhookLog ||
  mongoose.model<IStrapiWebhookLog>("StrapiWebhookLog", StrapiWebhookLogSchema);

export default StrapiWebhookLog;
