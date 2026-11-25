import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminInvitation extends Document {
  email: string;
  normalizedEmail: string;
  name: string;
  roleId?: mongoose.Types.ObjectId;
  roleSlug: string;
  tokenHash: string;
  invitedBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  acceptedAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AdminInvitationSchema = new Schema<IAdminInvitation>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    normalizedEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
    },
    roleSlug: {
      type: String,
      required: true,
      lowercase: true,
      default: "dispatcher",
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const AdminInvitation: Model<IAdminInvitation> =
  mongoose.models.AdminInvitation ||
  mongoose.model<IAdminInvitation>("AdminInvitation", AdminInvitationSchema);

export default AdminInvitation;
