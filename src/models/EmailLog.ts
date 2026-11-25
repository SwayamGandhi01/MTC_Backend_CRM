import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmailDeliveryEvent {
  event: string;
  timestamp: Date;
  data?: Record<string, any>;
}

export interface IEmailLog extends Document {
  recipient: string;
  subject: string;
  templateName: string;
  status: "Sent" | "Failed" | "Queued" | "Delivered" | "Delayed" | "Bounced" | "Complained" | "Opened" | "Clicked";
  referenceId?: string;
  resendMessageId?: string;
  category?: "customer" | "admin" | "auth" | "system";
  relatedEntityType?: "appointment" | "enquiry" | "callback" | "user" | "customer";
  relatedEntityId?: string;
  sender?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  deliveryTimeline: IEmailDeliveryEvent[];
  lastEventAt?: Date;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailDeliveryEventSchema = new Schema<IEmailDeliveryEvent>(
  {
    event: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    data: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

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
      enum: ["Sent", "Failed", "Queued", "Delivered", "Delayed", "Bounced", "Complained", "Opened", "Clicked"],
      default: "Sent",
      index: true,
    },
    referenceId: {
      type: String,
      index: true,
    },
    resendMessageId: {
      type: String,
      index: true,
      sparse: true,
    },
    category: {
      type: String,
      enum: ["customer", "admin", "auth", "system"],
      default: "system",
      index: true,
    },
    relatedEntityType: {
      type: String,
      enum: ["appointment", "enquiry", "callback", "user", "customer"],
      index: true,
    },
    relatedEntityId: {
      type: String,
      index: true,
    },
    sender: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
    },
    deliveryTimeline: {
      type: [EmailDeliveryEventSchema],
      default: [],
    },
    lastEventAt: {
      type: Date,
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
EmailLogSchema.index({ status: 1, createdAt: -1 });
EmailLogSchema.index({ relatedEntityType: 1, relatedEntityId: 1 });

export const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog || mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);

export default EmailLog;
