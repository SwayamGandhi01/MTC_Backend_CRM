import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRole extends Document {
  name: string;
  slug: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    permissions: {
      type: [String],
      default: [],
    },
    isSystemRole: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
  },
  {
    timestamps: true,
  }
);

export const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema);

export default Role;
