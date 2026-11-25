import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document {
  fullName: string;
  email?: string;
  phoneNumber: string;
  normalizedPhone: string;
  postcode: string;
  address?: string;
  vehicleReg?: string;
  vehicles: string[];
  notes?: string;
  totalBookings: number;
  totalEnquiries: number;
  totalCallbacks: number;
  totalSpent: number;
  tags: string[];
  status: "active" | "vip" | "flagged" | "archived";
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    fullName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      index: true,
    },
    normalizedPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    postcode: {
      type: String,
      required: [true, "Postcode is required"],
      trim: true,
      uppercase: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
    },
    vehicleReg: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    vehicles: {
      type: [String],
      default: [],
      index: true,
    },
    notes: {
      type: String,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    totalEnquiries: {
      type: Number,
      default: 0,
    },
    totalCallbacks: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "vip", "flagged", "archived"],
      default: "active",
      index: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;
