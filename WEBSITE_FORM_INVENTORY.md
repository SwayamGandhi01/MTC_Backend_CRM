# Mobile Tyre Champions – Website Form Inventory & Mapping

## 1. Overview

This document presents a comprehensive audit of all customer-facing forms, modals, and submission components across the Mobile Tyre Champions website (`mobiletyre-frontend`), their field definitions, validation rules, existing API destinations, and their destination in the independent CRM.

---

## 2. Form Inventory & Mapping Matrix

### Form 1: Main Online Booking Form (Appointment Submission)
- **Component / View:** `src/views/BookingPage.jsx` and `src/components/LocationBookingForm.jsx`
- **Underlying Client Service:** `src/api/appointmentService.js` (`submitAppointment` function)
- **Page Route(s):** `/booking`, `/booking?postcode=[POSTCODE]`, and local landing pages utilizing `LocationBookingForm`
- **Fields Collected:**
  - `fullName` (string, required): Customer's full name (min 2 chars)
  - `phoneNumber` (string, required): UK Phone number (validated: domestic 11 digits / international +44)
  - `email` (string, required): Valid email address (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
  - `vehicleReg` (string, required on `/booking`): Vehicle registration plate (uppercase)
  - `postcode` (string, required): UK Postcode (e.g., GU11 3HY)
  - `address` / `town` (string, optional/fallback): Customer street address or town
  - `locationNotes` (string, optional): Parking instructions, breakdown location, Google Maps query link
  - `serviceType` (string, required): Service name (e.g., "Mobile Tyre Fitting", "Emergency Mobile Tyre Fitting")
  - `tyreWidth` / `profile` / `rim` / `speed` ➔ `tyreSize` (string, required): E.g., `205/55 R16 91V`
  - `timingSlot` (string, required): E.g., "Slot 7am - 12pm", "As Soon As Possible"
  - `latitude` / `longitude` (number, optional): Geolocation coordinates if available
- **Client-Side Validation:**
  - Full name length $\ge 2$ chars
  - UK phone format via regex / digit length (10–13 digits, starting with 0 or 44)
  - Valid email format
  - Complete tyre dimensions required (Width, Profile, Rim, Speed)
  - Timing slot required
  - Postcode coverage verified before form display
- **Existing API Destination:**
  - `POST https://enduring-morning-cf86e59201.strapiapp.com/api/appointments`
- **Proposed Independent CRM Destination:**
  - `POST /api/public/appointments`
- **Target Mongoose Model:**
  - `Appointment` (collection: `appointments`)
  - Associated/Upserted `Customer` (collection: `customers`)

---

### Form 2: Contact Enquiry Form
- **Component / View:** `src/views/ContactPage.jsx`
- **Page Route(s):** `/contact`, `/contact?location=[LOCATION]`
- **Fields Collected:**
  - `fullName` (string, required): Customer contact name
  - `phoneNumber` (string, required): Mobile number
  - `postcode` (string, required): Current sector or postcode
  - `serviceRequired` (string, required): Dropdown selection:
    - "Immediate Emergency Fitting"
    - "Premium Tyre Service"
    - "Puncture Repair"
  - `message` (string, required): Inquiry details / tyre size
- **Client-Side Validation:**
  - HTML5 required attributes on all fields
  - Service selection required
- **Existing API Destination:**
  - `POST https://enduring-morning-cf86e59201.strapiapp.com/api/contact-requests`
- **Proposed Independent CRM Destination:**
  - `POST /api/public/contact`
- **Target Mongoose Model:**
  - `Enquiry` (collection: `enquiries`, `type: "contact"`)
  - Associated/Upserted `Customer` (collection: `customers`)

---

### Form 3: Arrange-a-Callback Form (Find Tyres Flow)
- **Component / View:** `src/components/TyreFinder.jsx` (`handleArrangeSubmit`)
- **Page Route(s):** `/find-tyres`, homepage widget tab
- **Fields Collected:**
  - `mobileNumber` / `phoneNumber` (string, required): Customer contact mobile
  - `regNumber` / `vehicleReg` (string, optional): Vehicle registration plate
  - `postcode` (string, required): UK postcode
  - `width` (string/number, optional): Tyre width (e.g. 205)
  - `height` (string/number, optional): Tyre profile (e.g. 55)
  - `diameter` (string/number, optional): Rim size (e.g. 16)
  - `brand` (string, optional): Brand preference (e.g. Michelin, Budget)
  - `Season` (string, optional): Summer, Winter, All-Season
  - `title` (string, optional): Generated title e.g. "205/55 16"
  - `notes` (string, optional): Additional request notes
- **Client-Side Validation:**
  - Mobile number required
  - Postcode required
- **Existing API Destination:**
  - `POST https://enduring-morning-cf86e59201.strapiapp.com/api/arrange-a-call-backs`
- **Proposed Independent CRM Destination:**
  - `POST /api/public/callbacks`
- **Target Mongoose Model:**
  - `CallbackRequest` (collection: `callbacks` or `enquiries` with `type: "callback"`)
  - Associated/Upserted `Customer` (collection: `customers`)

---

### Form 4: Postcode Availability Checker
- **Component / View:** `src/components/QuickAvailabilityForm.jsx` and `src/lib/useAvailability.js`
- **Page Route(s):** Homepage hero, sticky floating widgets, `/booking` entry validation
- **Fields Collected:**
  - `postcode` (string, required): UK postcode or sector (e.g. GU11, GU11 3HY, RG21, SL1)
- **Client-Side & Server Validation:**
  - Max 32 characters
  - Evaluated against coverage criteria (`src/lib/coverage.js`)
- **Existing API Destination:**
  - `GET /api/availability?postcode=[POSTCODE]` in `mobiletyre-frontend`
- **Proposed Independent CRM Logging:**
  - `POST /api/public/availability`
  - Evaluates/logs each postcode search so dispatchers can identify coverage demand in unserviced areas or track hot zones.
- **Target Mongoose Model:**
  - `AvailabilityRequest` (collection: `availability_requests`)
