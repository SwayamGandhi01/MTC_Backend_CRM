import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISecurityEvent extends Document {
  actorUserId?: mongoose.Types.ObjectId | null;
  actorEmail?: string;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  metadata?: Record<string, any>;
  createdAt: Date;
}

const SecurityEventSchema = new Schema<ISecurityEvent>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      index: true,
    },
    actorEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    severity: {
      type: String,
      enum: ["INFO", "WARNING", "CRITICAL"],
      default: "INFO",
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

SecurityEventSchema.index({ createdAt: -1 });

export const SecurityEvent: Model<ISecurityEvent> =
  mongoose.models.SecurityEvent ||
  mongoose.model<ISecurityEvent>("SecurityEvent", SecurityEventSchema);

export default SecurityEvent;
