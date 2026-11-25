# Mobile Tyre Champions – Database Design & Mongoose Schemas

This document defines the complete MongoDB Atlas database architecture for the Mobile Tyre Champions CRM system.

---

## 1. Core Architectural Standards

- **Database Engine:** MongoDB Atlas (v6.0+)
- **ODM:** Mongoose 8.x
- **Naming Conventions:**
  - Collection names: Lowercase plural snake_case (`admin_users`, `appointments`, `customers`)
  - Field names: CamelCase (`fullName`, `phoneNumber`, `vehicleReg`)
  - References: Mongoose `ObjectId` pointing to model names
- **Timestamps:** Automatic `createdAt` and `updatedAt` on all documents.

---

## 2. Collection Specifications

### 2.1 Collection: `admin_users`
Stores administrative staff accounts and security credentials.

```typescript
{
  _id: ObjectId,
  email: String,                  // lowercase, unique, indexed
  passwordHash: String,           // Argon2id hash
  name: String,                   // Display name
  role: String,                   // enum: ["superadmin", "admin", "dispatcher", "viewer"]
  status: String,                 // enum: ["active", "inactive", "suspended"]
  failedLoginAttempts: Number,    // Counter for brute force protection (default: 0)
  lockUntil: Date,                // Lockout expiration timestamp
  lastLoginAt: Date,              // Last successful login timestamp
  lastLoginIp: String,            // IP address of last successful login
  createdAt: Date,
  updatedAt: Date
}
```
**Indexes:**
- `{ email: 1 }` (unique)
- `{ role: 1, status: 1 }`

---

### 2.2 Collection: `sessions`
Tracks active administrative sessions with automatic TTL expiration.

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: AdminUser), // Foreign key to admin_users
  tokenHash: String,                 // SHA-256 hash of the issued JWT token
  expiresAt: Date,                   // Expiry date
  revoked: Boolean,                  // Manual revocation flag (default: false)
  userAgent: String,                 // Client browser user agent
  ipAddress: String,                 // Origin IP
  lastActiveAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```
**Indexes:**
- `{ tokenHash: 1 }` (unique)
- `{ userId: 1, revoked: 1 }`
- `{ expiresAt: 1 }` (TTL index: `expireAfterSeconds: 0`)

---

### 2.3 Collection: `customers`
Comprehensive customer profiles, vehicle registrations, and lifetime history.

```typescript
{
  _id: ObjectId,
  fullName: String,               // Customer name
  email: String,                  // lowercase, indexed
  phoneNumber: String,            // Primary phone, indexed
  postcode: String,               // uppercase, indexed
  address: String,                // Full billing / fitting address
  vehicleReg: String,             // uppercase UK registration plate
  notes: String,                  // Dispatcher & technician notes
  totalBookings: Number,          // Aggregate booking counter (default: 0)
  totalSpent: Number,             // Lifetime customer revenue in GBP (default: 0)
  tags: [String],                 // e.g. ["VIP", "Fleet", "Emergency"]
  status: String,                 // enum: ["active", "vip", "flagged", "archived"]
  createdAt: Date,
  updatedAt: Date
}
```
**Indexes:**
- `{ phoneNumber: 1, email: 1 }`
- `{ vehicleReg: 1 }`
- `{ postcode: 1 }`

---

### 2.4 Collection: `appointments`
Primary operational dispatch tickets for mobile tyre replacement and repairs.

```typescript
{
  _id: ObjectId,
  bookingRef: String,             // Unique alphanumeric booking ref, e.g. "MTC-8491"
  customer: ObjectId (ref: Customer),
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  vehicleReg: String,             // UK Reg plate
  postcode: String,               // GU14, RG12, SL6, etc.
  address: String,                // Full street address / breakdown location
  locationNotes: String,          // e.g. "Parked in driveway behind white van"
  serviceType: String,            // "Emergency Mobile Tyre Fitting", "Puncture Repair"
  tyreSize: String,               // e.g. "225/45 R17 94W"
  tyreQuantity: Number,           // 1 to 4
  tyreBrandPreference: String,    // "Michelin", "Budget", "Mid-Range"
  timingSlot: String,             // "ASAP / 60-90 Mins", "Morning (8am-12pm)"
  bookingDate: Date,              // Scheduled appointment date
  status: String,                 // enum: ["pending", "confirmed", "assigned", "in_progress", "completed", "cancelled"]
  paymentStatus: String,          // enum: ["pending", "paid", "partial", "refunded"]
  technicianId: ObjectId (ref: Technician),
  technicianName: String,
  priceQuote: Number,             // Quoted amount in GBP
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```
**Indexes:**
- `{ bookingRef: 1 }` (unique)
- `{ bookingDate: -1, status: 1 }`
- `{ customerPhone: 1, vehicleReg: 1 }`
- `{ technicianId: 1, bookingDate: 1 }`

---

### 2.5 Collection: `enquiries`
Inbound quote requests, contact form submissions, and emergency callbacks.

```typescript
{
  _id: ObjectId,
  fullName: String,
  email: String,
  phoneNumber: String,
  postcode: String,
  vehicleReg: String,
  serviceRequired: String,
  tyreSize: String,
  message: String,
  status: String,                 // enum: ["new", "contacted", "quoted", "converted", "closed"]
  assignedTo: ObjectId (ref: AdminUser),
  notes: String,
  source: String,                 // "website_enquiry_form", "phone_inbound", "emergency_banner"
  createdAt: Date,
  updatedAt: Date
}
```
**Indexes:**
- `{ createdAt: -1, status: 1 }`
- `{ phoneNumber: 1 }`

---

### 2.6 Collection: `technicians`
Mobile tyre fitting fleet, mobile vans, and technician schedules.

```typescript
{
  _id: ObjectId,
  name: String,
  phoneNumber: String,
  email: String,
  vanReg: String,                 // Mobile fitting van registration plate
  operatingZones: [String],       // e.g. ["Surrey North", "Hampshire East", "Berkshire"]
  status: String,                 // enum: ["on_duty", "on_break", "off_duty", "in_transit"]
  currentAppointmentId: ObjectId (ref: Appointment),
  rating: Number,                 // Average technician review score (e.g. 4.95)
  totalJobsCompleted: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 2.7 Collection: `services`
Catalog of mobile tyre fitting services and pricing parameters.

```typescript
{
  _id: ObjectId,
  title: String,                  // "Emergency Roadside Tyre Fitting"
  slug: String,                   // "emergency-roadside-fitting"
  description: String,
  basePrice: Number,              // Starting callout fee in GBP
  estimatedMinutes: Number,       // Duration (e.g. 45 mins)
  isActive: Boolean,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 2.8 Collection: `locations`
Coverage areas, postal code sectors, and travel fee zones.

```typescript
{
  _id: ObjectId,
  townName: String,               // "Guildford", "Camberley", "Reading"
  postcodePrefix: String,         // "GU1", "GU15", "RG1"
  county: String,                 // "Surrey", "Hampshire", "Berkshire"
  calloutFee: Number,             // Standard callout fee
  emergencySurcharge: Number,     // Emergency out-of-hours addition
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 2.9 Collection: `email_logs`
Transactional email notifications dispatched via Resend.

```typescript
{
  _id: ObjectId,
  recipient: String,
  subject: String,
  templateName: String,           // "appointment_confirmation", "technician_en_route"
  resendMessageId: String,
  status: String,                 // "queued", "sent", "delivered", "bounced", "failed"
  errorDetails: String,
  relatedAppointmentId: ObjectId (ref: Appointment),
  sentAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 2.10 Collection: `activity_logs`
Security and administrative action audit trail.

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: AdminUser),
  action: String,                 // "APPOINTMENT_STATUS_UPDATE", "CUSTOMER_DELETE"
  entityType: String,             // "Appointment", "Customer", "AdminUser"
  entityId: String,
  previousState: Object,
  newState: Object,
  ipAddress: String,
  userAgent: String,
  createdAt: Date
}
```
