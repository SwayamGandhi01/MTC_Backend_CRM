import { z } from "zod";

/**
 * Validation regex patterns for UK mobile tyres operations
 */
const UK_PHONE_REGEX = /^(?:(?:\+44\s?|0)(?:7\d{3}\s?\d{6}|[12389]\d{1,4}\s?\d{3,4}\s?\d{3,4}|\d{9,11}))$/;
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?(\s?\d[A-Z]{2})?$/i;

/**
 * Public Booking / Appointment Intake Validation Schema
 */
export const publicAppointmentSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name exceeds maximum length"),
  phoneNumber: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .min(7, "Phone number is too short")
    .max(25, "Phone number is too long"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .optional()
    .or(z.literal("")),
  vehicleReg: z
    .string({ required_error: "Vehicle registration number is required" })
    .trim()
    .min(2, "Vehicle registration is required")
    .max(15, "Vehicle registration is too long")
    .transform((val) => val.toUpperCase().replace(/\s+/g, "")),
  postcode: z
    .string({ required_error: "Postcode is required" })
    .trim()
    .min(2, "Postcode is required")
    .max(12, "Postcode is too long")
    .transform((val) => val.toUpperCase().trim()),
  address: z.string().trim().optional().or(z.literal("")),
  town: z.string().trim().optional().or(z.literal("")),
  locationNotes: z.string().trim().optional().or(z.literal("")),
  serviceType: z
    .string({ required_error: "Service type is required" })
    .trim()
    .min(1, "Service type is required")
    .default("Mobile Tyre Fitting"),
  tyreSize: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  timingSlot: z
    .string({ required_error: "Timing slot is required" })
    .trim()
    .min(1, "Timing slot is required")
    .default("As Soon As Possible"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  sourcePage: z.string().trim().optional().default("/booking"),
  idempotencyKey: z.string().trim().optional(),
  honeypot: z.string().optional(), // Spam trap: must be empty
});

export type PublicAppointmentInput = z.infer<typeof publicAppointmentSchema>;

/**
 * Public Contact Enquiry Intake Validation Schema
 */
export const publicContactSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name exceeds maximum length"),
  phoneNumber: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .min(7, "Phone number is too short")
    .max(25, "Phone number is too long"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .optional()
    .or(z.literal("")),
  postcode: z
    .string({ required_error: "Postcode is required" })
    .trim()
    .min(2, "Postcode is required")
    .max(12, "Postcode is too long")
    .transform((val) => val.toUpperCase().trim()),
  serviceRequired: z
    .string({ required_error: "Service required is required" })
    .trim()
    .min(1, "Service selection is required"),
  message: z
    .string({ required_error: "Message is required" })
    .trim()
    .min(2, "Please provide inquiry details"),
  vehicleReg: z.string().trim().optional().or(z.literal("")),
  sourcePage: z.string().trim().optional().default("/contact"),
  idempotencyKey: z.string().trim().optional(),
  honeypot: z.string().optional(), // Spam trap
});

export type PublicContactInput = z.infer<typeof publicContactSchema>;

/**
 * Public Callback Request Intake Validation Schema
 */
export const publicCallbackSchema = z.object({
  mobileNumber: z
    .string({ required_error: "Mobile number is required" })
    .trim()
    .min(7, "Mobile number is too short")
    .max(25, "Mobile number is too long"),
  postcode: z
    .string({ required_error: "Postcode is required" })
    .trim()
    .min(2, "Postcode is required")
    .max(12, "Postcode is too long")
    .transform((val) => val.toUpperCase().trim()),
  regNumber: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? val.toUpperCase().replace(/\s+/g, "") : undefined)),
  width: z.string().trim().optional().nullable().or(z.literal("")),
  height: z.string().trim().optional().nullable().or(z.literal("")),
  diameter: z.string().trim().optional().nullable().or(z.literal("")),
  brand: z.string().trim().optional().nullable().or(z.literal("")),
  season: z.string().trim().optional().nullable().or(z.literal("")),
  title: z.string().trim().optional().nullable().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  sourcePage: z.string().trim().optional().default("/find-tyres"),
  idempotencyKey: z.string().trim().optional(),
  honeypot: z.string().optional(), // Spam trap
});

export type PublicCallbackInput = z.infer<typeof publicCallbackSchema>;

/**
 * Public Availability Check Logging Schema
 */
export const publicAvailabilitySchema = z.object({
  postcode: z
    .string({ required_error: "Postcode is required" })
    .trim()
    .min(2, "Postcode is required")
    .max(15, "Postcode is too long")
    .transform((val) => val.toUpperCase().trim()),
  status: z.enum(["supported", "unsupported", "invalid", "incomplete"]),
  message: z.string().trim().optional(),
  area: z.string().trim().optional(),
  county: z.string().trim().optional(),
  hub: z.string().trim().optional(),
  sourcePage: z.string().trim().optional().default("/"),
});

export type PublicAvailabilityInput = z.infer<typeof publicAvailabilitySchema>;
