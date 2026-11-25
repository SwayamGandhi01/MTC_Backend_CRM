import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmailLog extends Document {
  recipient: string;
  subject: string;
  templateName: string;
  status: "Sent" | "Failed" | "Queued" | "Delivered";
  referenceId?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  sentAt: Date;
  createdAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    templateName: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Sent", "Failed", "Queued", "Delivered"],
      default: "Sent",
      index: true,
    },
    referenceId: {
      type: String,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

EmailLogSchema.index({ createdAt: -1 });

export const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog || mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);
