# Mobile Tyre Champions – System Architecture Specification

## 1. Architectural Overview & Zero-Strapi Isolation

The Mobile Tyre Champions CRM is engineered as an entirely autonomous, modern enterprise web application built upon Next.js App Router and MongoDB Atlas. 

### Fundamental Architectural Rules
1. **Zero Connection to Strapi:** No Strapi SDK, no Strapi bridge, no Strapi REST/GraphQL calls, and no Strapi database connections.
2. **Dedicated MongoDB Atlas Persistence:** All business entities (customers, appointments, enquiries, fleet, communications, content) reside in an isolated MongoDB Atlas cluster.
3. **Next.js Full-Stack Architecture:** Next.js Route Handlers (`/api/admin/*`, `/api/auth/*`) form the backend API layer with native TypeScript type sharing across frontend components and backend logic.
4. **Server vs Client Boundary:** Private secrets, database connections, and password algorithms are strictly confined to Node.js server runtimes. Client components receive only sanitized, serialized presentation state.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER / CLIENT                           │
│  - Modern Responsive Dashboard (Next.js Client Components)             │
│  - TanStack Data Tables, Recharts Velocity Charts                      │
│  - Secure HTTP-Only Cookie (mtc_admin_session)                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (JSON / Cookies)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 15 APP ROUTER LAYER                        │
│                                                                        │
│   ┌──────────────────────────────┐    ┌────────────────────────────┐  │
│   │ Server Components & Layouts  │    │ Route Handlers (API Layer) │  │
│   │  - /dashboard                │    │  - /api/admin/auth/*       │  │
│   │  - /appointments             │    │  - /api/admin/customers/*  │  │
│   │  - /customers                │    │  - /api/admin/appointments │  │
│   │  - /technicians              │    │  - /api/admin/enquiries/*  │  │
│   └──────────────┬───────────────┘    └─────────────┬──────────────┘  │
│                  │                                  │                 │
│                  ▼                                  ▼                 │
│   ┌────────────────────────────────────────────────────────────────┐  │
│   │                     APPLICATION LOGIC LAYER                    │  │
│   │  - Argon2id Password Security (@node-rs/argon2)                │  │
│   │  - JOSE / JWT Session Cookie Engine                            │  │
│   │  - Role-Based Access Control (RBAC Guard)                      │  │
│   │  - Zod Input Validation & Sanitization                         │  │
│   │  - Resend Email Service Integration                            │  │
│   └──────────────────────────────┬─────────────────────────────────┘  │
│                                  │ Cached Connection Singleton        │
│                                  ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐  │
│   │                    MONGOOSE ODM / DATA LAYER                   │  │
│   │  - AdminUser, Session, Customer, Appointment, Enquiry, etc.    │  │
│   └──────────────────────────────┬─────────────────────────────────┘  │
└──────────────────────────────────┼────────────────────────────────────┘
                                   │ TLS Encrypted Protocol
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         MONGODB ATLAS CLUSTER                          │
│  Database: mtc_crm                                                     │
│  Collections: admin_users, sessions, customers, appointments,          │
│               enquiries, technicians, services, locations, etc.       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Architecture & Layer Responsibilities

### Presentation Layer (`src/components/`)
- `ui/`: Primitives built with Tailwind CSS conforming to WAI-ARIA patterns (Card, Button, Input, Table, Badge).
- `layout/`: Global navigation structures (Sidebar, Header, MobileNav drawer, UserDropdown profile controls).
- `dashboard/`: Rich domain widgets including KPI velocity indicators, Recharts volume graphs, urgent dispatch cards, and quick actions drawers.
- `forms/`: Interactive client forms with validation, password visibility toggles, and instant visual feedback.

### Routing & View Layer (`src/app/`)
- `(auth)/login/`: Dedicated authentication portal isolated from dashboard chrome.
- `(dashboard)/`: Authenticated shell wrapping all 15 operational modules.
- `api/admin/`: Internal secure API surface handling data mutations and lookups.

### Domain & Business Logic (`src/lib/`)
- `db/mongodb.ts`: Production-hardened cached MongoDB Atlas connection singleton resilient to Next.js serverless recycling and local fast-refresh reloads.
- `auth/`: OWASP-compliant password hashing with Argon2id and stateless cryptographic JWT session cookie management.
- `validations/`: Centralized Zod validation schemas ensuring input safety.
- `api/`: Standardized JSON envelopes and HTTP status error abstraction.

### Persistence Layer (`src/models/`)
- Pure Mongoose schemas featuring strict typing, compound query indexing, TTL cleanup, and lifecycle hooks.

---

## 3. Brand & Design System Implementation

The user interface implements the Mobile Tyre Champions corporate identity:

| Token | Hex Value | Semantic Purpose |
|---|---|---|
| **Navy Primary** | `#0C162D` | Sidebar background, primary brand cards, brand headers |
| **Navy Dark** | `#080F20` | Contrast headers, dropdown panels, active highlights |
| **Royal Blue** | `#00468B` | Active navigation indicators, info banners, secondary buttons |
| **Emergency Orange** | `#E67E22` | Callouts, emergency alerts, active dispatch tags, KPI sparks |
| **Surface Gray** | `#F8FAFC` | Main application background |
| **Border Neutral** | `#E2E8F0` | Structural card borders and table dividers |

---

## 4. Multi-Tenant Role Isolation (RBAC)

The system supports four distinct operational roles:
1. **SuperAdmin:** Unrestricted access across system parameters, billing, staff accounts, and security audit logs.
2. **Admin:** Full operational control across customer records, appointments, inventory, and public website content.
3. **Dispatcher:** Dedicated triage controls for scheduling, assigning mobile vans, and managing active roadside customer tickets.
4. **Viewer:** Read-only access for reporting and operational visibility without mutation privileges.
