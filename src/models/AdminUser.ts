import mongoose, { Schema, Document, Model } from "mongoose";

export type AdminUserStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export interface IAdminUser extends Document {
  name: string;
  email: string;
  normalizedEmail: string;
  passwordHash: string;
  roleId?: mongoose.Types.ObjectId;
  role: string;
  status: AdminUserStatus;
  isSuperAdmin: boolean;
  mfaEnabled: boolean;
  mfaSecretEncrypted?: string | null;
  mfaPendingSecretEncrypted?: string | null;
  mfaVerifiedAt?: Date | null;
  recoveryCodes: string[];
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  failedLoginAttempts: number;
  lockUntil?: Date;
  invitedBy?: mongoose.Types.ObjectId;
  deactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    normalizedEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      index: true,
    },
    role: {
      type: String,
      required: true,
      lowercase: true,
      default: "dispatcher",
      index: true,
    },
    status: {
      type: String,
      enum: ["INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"],
      default: "ACTIVE",
      required: true,
      index: true,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    mfaSecretEncrypted: {
      type: String,
      default: null,
    },
    mfaPendingSecretEncrypted: {
      type: String,
      default: null,
    },
    mfaVerifiedAt: {
      type: Date,
      default: null,
    },
    recoveryCodes: {
      type: [String],
      default: [],
    },
    passwordChangedAt: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
    deactivatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const AdminUser: Model<IAdminUser> =
  mongoose.models.AdminUser || mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);

export default AdminUser;
