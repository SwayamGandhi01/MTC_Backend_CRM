# Mobile Tyre Champions – Database Schema & Mongoose Architecture

## 1. Overview

The Mobile Tyre Champions CRM database layer is built using MongoDB Atlas and Mongoose 8.x. It enforces strict typing, compound query indexes, automatic timestamps, and centralized customer de-duplication across all customer-facing touchpoints.

---

## 2. Models & Collection Specifications

### 2.1 Collection: `appointments`
Represents mobile tyre fitting and emergency roadside dispatch tickets.

```typescript
interface IAppointment {
  _id: ObjectId;
  referenceId: string;            // e.g. "MTC-APT-8GGGRM" (unique, uppercase)
  bookingRef: string;             // synchronized with referenceId
  customer?: ObjectId;            // ref: Customer
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleReg: string;             // uppercase UK registration
  postcode: string;               // uppercase UK postcode
  address?: string;               // full street address or breakdown spot
  town?: string;
  locationNotes?: string;         // parking instructions, Google Maps link
  latitude?: number;
  longitude?: number;
  serviceType: string;            // "Emergency Mobile Tyre Fitting", etc.
  tyreSize?: string;              // e.g. "225/40 R18 92Y"
  tyreQuantity: number;           // default: 1
  tyreBrandPreference?: string;
  timingSlot: string;             // "Slot 7am - 12pm", "As Soon As Possible"
  bookingDate: Date;
  status: "pending" | "confirmed" | "assigned" | "in_progress" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "partial" | "refunded";
  technicianId?: ObjectId;        // ref: Technician
  technicianName?: string;
  priceQuote?: number;
  notes?: string;
  sourcePage?: string;            // "/booking", "/locations/aldershot"
  statusHistory: {
    status: string;
    changedBy: string;
    timestamp: Date;
    notes?: string;
  }[];
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
**Key Indexes:**
- `{ referenceId: 1 }` (unique)
- `{ createdAt: -1 }`
- `{ bookingDate: -1, status: 1 }`
- `{ customerPhone: 1, vehicleReg: 1 }`

---

### 2.2 Collection: `customers`
Stores deduplicated customer profiles linked across multiple booking appointments, inquiries, and callback requests.

```typescript
interface ICustomer {
  _id: ObjectId;
  fullName: string;
  email?: string;
  phoneNumber: string;            // raw phone input
  normalizedPhone: string;        // domestic UK digits for uniform lookup
  postcode: string;
  address?: string;
  vehicleReg?: string;            // most recent vehicle
  vehicles: string[];             // array of all known vehicle registrations
  totalBookings: number;
  totalEnquiries: number;
  totalCallbacks: number;
  totalSpent: number;
  tags: string[];                 // ["VIP", "Fleet", "Emergency"]
  status: "active" | "vip" | "flagged" | "archived";
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```
**Key Indexes:**
- `{ normalizedPhone: 1 }`
- `{ email: 1 }`
- `{ vehicleReg: 1 }`
- `{ lastActivityAt: -1 }`

---

### 2.3 Collection: `enquiries`
Stores contact form submissions and quote inquiries.

```typescript
interface IEnquiry {
  _id: ObjectId;
  referenceId: string;            // e.g. "MTC-ENQ-E9CXLU" (unique)
  customer?: ObjectId;            // ref: Customer
  fullName: string;
  email?: string;
  phoneNumber: string;
  postcode: string;
  vehicleReg?: string;
  serviceRequired: string;        // "Immediate Emergency Fitting", etc.
  tyreSize?: string;
  message: string;
  status: "new" | "contacted" | "quoted" | "converted" | "closed";
  assignedTo?: ObjectId;          // ref: AdminUser
  notes?: string;
  sourcePage?: string;
  statusHistory: {
    status: string;
    changedBy: string;
    timestamp: Date;
    notes?: string;
  }[];
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
**Key Indexes:**
- `{ referenceId: 1 }` (unique)
- `{ createdAt: -1, status: 1 }`

---

### 2.4 Collection: `callback_requests`
Stores automated callback requests from the Tyre Finder wizard.

```typescript
interface ICallbackRequest {
  _id: ObjectId;
  referenceId: string;            // e.g. "MTC-CB-PD3TKC" (unique)
  customer?: ObjectId;            // ref: Customer
  mobileNumber: string;
  postcode: string;
  regNumber?: string;
  width?: string;
  height?: string;
  diameter?: string;
  brand?: string;
  season?: string;
  title?: string;
  notes?: string;
  status: "pending" | "called" | "booked" | "no_answer" | "closed";
  sourcePage?: string;
  statusHistory: {
    status: string;
    changedBy: string;
    timestamp: Date;
    notes?: string;
  }[];
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
**Key Indexes:**
- `{ referenceId: 1 }` (unique)
- `{ createdAt: -1, status: 1 }`

---

### 2.5 Collection: `availability_requests`
Stores postcode availability checks from homepage and landing page widgets.

```typescript
interface IAvailabilityRequest {
  _id: ObjectId;
  postcode: string;
  status: "supported" | "unsupported" | "invalid" | "incomplete";
  message?: string;
  area?: string;
  county?: string;
  hub?: string;
  sourcePage?: string;
  ipAddress?: string;
  createdAt: Date;
}
```
**Key Indexes:**
- `{ createdAt: -1 }`
- `{ postcode: 1 }`

---

### 2.6 Collections: `admin_users` & `sessions`
Authentication, RBAC staff roles (SuperAdmin, Admin, Dispatcher, Viewer), and encrypted sessions with MongoDB TTL expiration.
