# Mobile Tyre Champions – Independent CRM API Documentation

## 1. Overview & Architecture

This document specifies the complete API surface of the independent Mobile Tyre Champions CRM built on Next.js 15 App Router.

- **Public Intake Namespace:** `/api/public/*` — Receives customer submissions from `mobiletyrechampions.com` with CORS support, Zod validation, rate limiting, and honeypot protection.
- **Admin Management Namespace:** `/api/admin/*` — Authenticated, role-protected endpoints for querying, filtering, paginating, and updating submissions.

---

## 2. Public Intake APIs (`/api/public/*`)

### 2.1 Submit Appointment / Booking
- **Route:** `POST /api/public/appointments`
- **CORS:** Enabled (`Access-Control-Allow-Origin: *`)
- **Rate Limit:** 30 requests per 10 minutes per IP
- **Description:** Receives bookings from the main booking form and location landing pages.
- **Request Payload:**
```json
{
  "fullName": "Michael Harrison",
  "phoneNumber": "07700900888",
  "email": "michael.harrison@gmail.com",
  "vehicleReg": "WP18 XKK",
  "postcode": "GU14 7LR",
  "address": "45 Queens Road, Farnborough",
  "town": "Farnborough",
  "serviceType": "Emergency Mobile Tyre Fitting",
  "tyreSize": "225/40 R18 92Y",
  "timingSlot": "Slot 7am - 12pm",
  "locationNotes": "Parked in driveway next to red garage",
  "sourcePage": "/booking",
  "idempotencyKey": "appt_1732438800_abc123",
  "honeypot": ""
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Appointment submitted successfully! Our dispatch team will contact you shortly.",
  "submissionId": "MTC-APT-8GGGRM",
  "referenceId": "MTC-APT-8GGGRM",
  "data": {
    "referenceId": "MTC-APT-8GGGRM",
    "customerName": "Michael Harrison",
    "vehicleReg": "WP18XKK",
    "status": "pending",
    "createdAt": "2026-11-24T07:31:07.123Z"
  }
}
```
- **Validation Failure (`422 Unprocessable Entity`):**
```json
{
  "success": false,
  "message": "Full name must be at least 2 characters",
  "fieldErrors": {
    "fullName": "Full name must be at least 2 characters",
    "phoneNumber": "Phone number is too short"
  }
}
```

---

### 2.2 Submit Contact Enquiry
- **Route:** `POST /api/public/contact`
- **Request Payload:**
```json
{
  "fullName": "Emma Watson",
  "phoneNumber": "07700900999",
  "email": "emma.watson@outlook.com",
  "postcode": "RG1 1AA",
  "serviceRequired": "Immediate Emergency Fitting",
  "message": "Need puncture repair near Reading Oracle shopping centre asap",
  "sourcePage": "/contact"
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Thank you for reaching out! Our expert dispatch team will contact you shortly.",
  "submissionId": "MTC-ENQ-E9CXLU",
  "referenceId": "MTC-ENQ-E9CXLU",
  "data": {
    "referenceId": "MTC-ENQ-E9CXLU",
    "fullName": "Emma Watson",
    "serviceRequired": "Immediate Emergency Fitting",
    "status": "new",
    "createdAt": "2026-11-24T07:31:08.456Z"
  }
}
```

---

### 2.3 Submit Callback Request (Tyre Finder)
- **Route:** `POST /api/public/callbacks`
- **Request Payload:**
```json
{
  "mobileNumber": "07700900111",
  "postcode": "SL4 1QD",
  "regNumber": "AK19 SMR",
  "width": "245",
  "height": "45",
  "diameter": "18",
  "brand": "Continental",
  "season": "All-Season",
  "notes": "Price check for 2 rear tyres",
  "sourcePage": "/find-tyres"
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Callback request confirmed! Our fitting specialist will call you back within 15 minutes.",
  "submissionId": "MTC-CB-PD3TKC",
  "referenceId": "MTC-CB-PD3TKC",
  "data": {
    "referenceId": "MTC-CB-PD3TKC",
    "mobileNumber": "07700900111",
    "postcode": "SL4 1QD",
    "status": "pending",
    "createdAt": "2026-11-24T07:31:09.789Z"
  }
}
```

---

### 2.4 Log Postcode Availability Check
- **Route:** `POST /api/public/availability`
- **Request Payload:**
```json
{
  "postcode": "GU14 7LR",
  "status": "supported",
  "message": "Mobile Tyre Fitter Available Near You",
  "area": "Farnborough",
  "county": "Hampshire",
  "hub": "Aldershot Depot",
  "sourcePage": "/"
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Availability check logged.",
  "id": "6b053d3f28855fc35c15df7d"
}
```

---

## 3. Authenticated Admin APIs (`/api/admin/*`)

### 3.1 Appointments Management
- `GET /api/admin/appointments`: List appointments with pagination (`page`, `limit`), filtering (`status`, `serviceType`), and search (`search`).
- `GET /api/admin/appointments/[id]`: Retrieve single appointment with populated customer details.
- `PATCH /api/admin/appointments/[id]`: Update status (`pending`, `confirmed`, `assigned`, `in_progress`, `completed`, `cancelled`), assign technician, update price quote, or add dispatcher notes. Automatically appends to `statusHistory` audit log.
- `DELETE /api/admin/appointments/[id]`: Permanently delete appointment (restricted to `SuperAdmin`).

### 3.2 Enquiries Management
- `GET /api/admin/enquiries`: List contact inquiries with pagination and status filters.
- `GET /api/admin/enquiries/[id]`: Retrieve single enquiry.
- `PATCH /api/admin/enquiries/[id]`: Update enquiry status (`new`, `contacted`, `quoted`, `converted`, `closed`) and internal notes.

### 3.3 Callbacks Management
- `GET /api/admin/callbacks`: List Tyre Finder callback requests.
- `GET /api/admin/callbacks/[id]`: Retrieve single callback request.
- `PATCH /api/admin/callbacks/[id]`: Update status (`pending`, `called`, `booked`, `no_answer`, `closed`) and dispatcher notes.

### 3.4 Customers & Unified History
- `GET /api/admin/customers`: Paginated, searchable customer directory by phone, email, vehicle registration plate, or postcode.
- `GET /api/admin/customers/[id]`: Comprehensive customer profile including lifetime booking history, past enquiries, tyre callback requests, and known vehicles.

### 3.5 Availability Intelligence
- `GET /api/admin/availability`: Real-time analytics of customer postcode checks, coverage conversion rates, and uncovered district demand.

### 3.6 Operations Dashboard Analytics
- `GET /api/admin/dashboard/stats`: Aggregated live metrics including active emergency bookings, queue counts, today's lead volume, and recent submission queue.
