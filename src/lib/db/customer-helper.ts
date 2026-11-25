import { Customer, ICustomer } from "@/models/Customer";

/**
 * Normalizes phone numbers to standard numeric string format
 * e.g., "+44 207 101 3856" -> "442071013856", "0207 101 3856" -> "02071013856"
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  // Normalize leading 44 to domestic 0 for uniform UK lookup
  if (digits.startsWith("44") && digits.length >= 11) {
    return "0" + digits.substring(2);
  }
  return digits;
}

/**
 * Generates human-friendly unique reference IDs
 * e.g. MTC-APT-849123, MTC-ENQ-293812, MTC-CB-938201
 */
export function generateReferenceId(prefix: "APT" | "ENQ" | "CB"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MTC-${prefix}-${random}`;
}

interface CustomerLinkParams {
  fullName: string;
  phoneNumber: string;
  email?: string;
  postcode: string;
  vehicleReg?: string;
  address?: string;
  type: "booking" | "enquiry" | "callback";
}

/**
 * Finds an existing customer by normalized phone number or email,
 * updates vehicle registrations and counters, or creates a new customer.
 * Prevents unnecessary duplicate customer records across form submissions.
 */
export async function findOrCreateCustomer(
  params: CustomerLinkParams
): Promise<ICustomer> {
  const normPhone = normalizePhoneNumber(params.phoneNumber);
  const normEmail = params.email ? params.email.toLowerCase().trim() : undefined;
  const upperReg = params.vehicleReg ? params.vehicleReg.toUpperCase().replace(/\s+/g, "") : undefined;

  // Build query: match by normalized phone or email
  const queryConditions: any[] = [];
  if (normPhone) queryConditions.push({ normalizedPhone: normPhone });
  if (normEmail) queryConditions.push({ email: normEmail });

  let customer = queryConditions.length > 0
    ? await Customer.findOne({ $or: queryConditions })
    : null;

  if (customer) {
    // Update existing customer record with latest information
    if (!customer.fullName && params.fullName) {
      customer.fullName = params.fullName.trim();
    }
    if (!customer.email && normEmail) {
      customer.email = normEmail;
    }
    if (params.postcode) {
      customer.postcode = params.postcode.toUpperCase().trim();
    }
    if (params.address && !customer.address) {
      customer.address = params.address.trim();
    }

    // Add vehicle registration if new
    if (upperReg) {
      if (!customer.vehicles) customer.vehicles = [];
      if (!customer.vehicles.includes(upperReg)) {
        customer.vehicles.push(upperReg);
      }
      customer.vehicleReg = upperReg;
    }

    // Update counters and activity
    if (params.type === "booking") {
      customer.totalBookings = (customer.totalBookings || 0) + 1;
    } else if (params.type === "enquiry") {
      customer.totalEnquiries = (customer.totalEnquiries || 0) + 1;
    } else if (params.type === "callback") {
      customer.totalCallbacks = (customer.totalCallbacks || 0) + 1;
    }

    customer.lastActivityAt = new Date();
    await customer.save();
    return customer;
  }

  // Create new customer record
  const vehicles = upperReg ? [upperReg] : [];
  const newCustomer = new Customer({
    fullName: params.fullName.trim(),
    email: normEmail,
    phoneNumber: params.phoneNumber.trim(),
    normalizedPhone: normPhone || params.phoneNumber.trim(),
    postcode: params.postcode.toUpperCase().trim(),
    address: params.address?.trim(),
    vehicleReg: upperReg,
    vehicles,
    totalBookings: params.type === "booking" ? 1 : 0,
    totalEnquiries: params.type === "enquiry" ? 1 : 0,
    totalCallbacks: params.type === "callback" ? 1 : 0,
    totalSpent: 0,
    status: "active",
    lastActivityAt: new Date(),
  });

  await newCustomer.save();
  return newCustomer;
}
