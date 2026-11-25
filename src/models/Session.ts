import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  ipAddress?: string;
  userAgent?: string;
  deviceLabel?: string;
  revokedReason?: string;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    deviceLabel: {
      type: String,
    },
    revokedReason: {
      type: String,
    },
  },
  {
    timestamps: false,
  }
);

// TTL index to automatically purge expired sessions from MongoDB Atlas
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default Session;
