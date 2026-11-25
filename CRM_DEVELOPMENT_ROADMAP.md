# Mobile Tyre Champions – CRM Development Roadmap (Phases 1 to 14)

This roadmap outlines the complete strategic rollout plan for the Mobile Tyre Champions Independent Next.js & MongoDB Atlas CRM.

---

## Phase 1: Project Foundation & UI Architecture (Current Phase - Completed)
- [x] Initialized Next.js 15 App Router application with TypeScript and Tailwind CSS.
- [x] Implemented Mobile Tyre Champions brand tokens (Navy `#0C162D`, Orange `#E67E22`, Blue `#00468B`).
- [x] Developed login interface with validation and role testing shortcuts.
- [x] Constructed responsive layout with collapsible Sidebar, mobile drawer, and Header.
- [x] Built interactive Operations Overview Dashboard with KPI summary cards, Recharts velocity chart, and urgent queues.
- [x] Implemented cached MongoDB Atlas connection singleton using Mongoose (`src/lib/db/mongodb.ts`).
- [x] Designed core Mongoose schemas (`AdminUser`, `Session`, `Customer`, `Appointment`, `Enquiry`).
- [x] Implemented Argon2id password hashing and encrypted HTTP-only session cookies.
- [x] Scaffolded all 15 operational sidebar modules.
- [x] Author comprehensive architectural blueprints and database documentation.

---

## Phase 2: Live Appointment Triage & Dispatch Engine
- [ ] Connect `Appointment` Mongoose queries to Next.js Route Handlers (`/api/admin/appointments`).
- [ ] Implement TanStack Data Table with multi-column sorting, search by reg plate, and status filtering.
- [ ] Build Appointment Detail drawer with interactive Google Maps navigation link.
- [ ] Implement one-click status transitions:
  - `Pending` -> `Confirmed` -> `Assigned` -> `In Progress` -> `Completed` -> `Cancelled`.
- [ ] Add CSV export for filtered appointment records.

---

## Phase 3: Comprehensive Customer & Vehicle CRM
- [ ] Implement customer search across phone, email, and UK vehicle registration.
- [ ] Build Customer Profile view displaying lifetime bookings, total spend, and recurring tyre dimensions.
- [ ] Add customer status tags (VIP, Fleet, Emergency, Inactive).
- [ ] Implement internal dispatcher notes with timestamped author attribution.

---

## Phase 4: Inbound Enquiries & Quote Conversion Pipeline
- [ ] Real-time enquiries inbox for website quote requests and callback inquiries.
- [ ] Quick Quote Calculator based on standard service catalog fees.
- [ ] One-click action to convert an inbound enquiry into a confirmed appointment with prefilled customer details.
- [ ] Automated enquiry follow-up reminder flags.

---

## Phase 5: Mobile Van Fleet & Technician Management
- [ ] Technician directory with mobile van registration and onboard equipment profiles.
- [ ] Shift management and active on-duty/off-duty dispatch toggles.
- [ ] Visual technician route allocation across Surrey, Hampshire, and Berkshire postal sectors.
- [ ] Daily technician performance reports (jobs completed, average response time).

---

## Phase 6: Transactional Email & Customer Notifications
- [ ] Resend integration with verified domain `dispatch@mobiletyrechampions.com`.
- [ ] Automated email triggers:
  - Appointment Booking Confirmed
  - Technician En Route / Estimated Arrival
  - Job Completed & Digital Receipt
- [ ] Email dispatch logs with real-time delivery and bounce status tracking.

---

## Phase 7: Google Reviews & Reputation Management
- [ ] Google Business Profile Places API integration.
- [ ] Real-time sync of 5-star customer reviews and feedback.
- [ ] Automated post-service review request trigger via SMS/email.
- [ ] Testimonial spotlight selector for website showcase.

---

## Phase 8: Website Emergency Announcements & Content Controls
- [ ] Live toggle for website emergency roadside announcement bar.
- [ ] Content blocks manager for website value propositions and FAQs.
- [ ] Instant Next.js On-Demand ISR cache revalidation upon saving content updates.

---

## Phase 9: Service Catalog & Pricing Engine
- [ ] Dynamic service catalog CRUD (Emergency Fitting, Puncture Repair, Seasonal Swap).
- [ ] Weekend, bank holiday, and out-of-hours callout fee surcharge configurator.
- [ ] Public API endpoint exposing live service pricing to the customer frontend.

---

## Phase 10: Postal Coverage Zones & Travel Fee Calculator
- [ ] Coverage zone manager for Surrey, Hampshire, and Berkshire postal sectors.
- [ ] Dynamic travel fee calculator based on radial distance from main depot.
- [ ] Emergency weather / capacity restriction toggles per postal district.

---

## Phase 11: Tyre Inventory & Dimensions Catalog
- [ ] Comprehensive tyre size database (Width / Profile / Rim / Speed / Load).
- [ ] Tyre brand tier categorizer (Premium, Mid-Range, Budget).
- [ ] Van inventory stock count tracking and low-stock alert notifications.

---

## Phase 12: Roadside Fitting Photo Gallery
- [ ] High-resolution job photo upload with client-side compression.
- [ ] Vehicle brand and service categorization tags.
- [ ] License plate blurring compliance check before publishing to the live website.

---

## Phase 13: Admin Staff RBAC & Security Audit Logs
- [ ] Administrator user management interface (SuperAdmin, Admin, Dispatcher, Viewer).
- [ ] Active session inspector with remote token revocation capability.
- [ ] Complete security audit trail recording every state change and user action.

---

## Phase 14: Enterprise Analytics & Revenue Reporting
- [ ] Historical booking analytics and financial revenue dashboards.
- [ ] Geographic heatmaps showing high-demand breakdown corridors (M3, M4, A3).
- [ ] End-of-month accounting export (VAT, gross revenue, technician commissions).
