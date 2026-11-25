import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog extends Document {
  action: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      index: true,
    },
    actorId: {
      type: String,
    },
    actorName: {
      type: String,
      required: true,
      default: "System",
    },
    actorRole: {
      type: String,
      default: "System",
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
