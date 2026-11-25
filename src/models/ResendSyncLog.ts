import mongoose, { Schema, Document, Model } from "mongoose";

export interface IResendSyncLog extends Document {
  syncId: string;
  status: "in_progress" | "completed" | "failed" | "interrupted";
  startedAt: Date;
  completedAt?: Date;
  totalDiscovered: number;
  totalImported: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFailed: number;
  pagesProcessed: number;
  lastCursor?: string;
  hasMore: boolean;
  triggeredBy: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResendSyncLogSchema = new Schema<IResendSyncLog>(
  {
    syncId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "failed", "interrupted"],
      default: "in_progress",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    totalDiscovered: {
      type: Number,
      default: 0,
    },
    totalImported: {
      type: Number,
      default: 0,
    },
    totalUpdated: {
      type: Number,
      default: 0,
    },
    totalSkipped: {
      type: Number,
      default: 0,
    },
    totalFailed: {
      type: Number,
      default: 0,
    },
    pagesProcessed: {
      type: Number,
      default: 0,
    },
    lastCursor: {
      type: String,
    },
    hasMore: {
      type: Boolean,
      default: false,
    },
    triggeredBy: {
      type: String,
      default: "system",
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

ResendSyncLogSchema.index({ startedAt: -1 });

export const ResendSyncLog: Model<IResendSyncLog> =
  mongoose.models.ResendSyncLog ||
  mongoose.model<IResendSyncLog>("ResendSyncLog", ResendSyncLogSchema);

export default ResendSyncLog;
