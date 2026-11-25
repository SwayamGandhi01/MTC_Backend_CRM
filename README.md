# Mobile Tyre Champions – Independent CRM & Admin Management System

A modern, production-grade Customer Relationship Management (CRM) and Dispatch Operations Dashboard built specifically for **Mobile Tyre Champions**, operating across Surrey, Hampshire, and Berkshire.

---

## 1. Architectural Highlights

- **Framework:** Next.js 15 (App Router, Server Components & Route Handlers)
- **Language:** TypeScript 5.7+ (strict mode)
- **Styling:** Tailwind CSS with Mobile Tyre Champions brand design tokens:
  - Deep Navy: `#0C162D`
  - Navy Accent: `#1A2B4C`
  - Royal Blue: `#00468B`
  - Emergency Orange: `#E67E22`
  - Neutral Background: `#F8FAFC`
- **Database:** MongoDB Atlas via Mongoose with cached singleton connection management
- **Authentication:** Independent Argon2id password hashing + encrypted HTTP-only session cookies
- **UI Components:** Custom accessible component library inspired by shadcn/ui
- **Icons & Visuals:** Lucide React & Recharts
- **Strict Isolation:** Completely independent of Strapi, legacy systems, or public API endpoints.

---

## 2. Directory Structure

```
mobiletyre-admin/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/                  # Secure administrator sign-in
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Protected dashboard layout with Sidebar & Header
│   │   │   ├── dashboard/              # Operations overview with live KPIs & charts
│   │   │   ├── appointments/           # Live appointment dispatch & scheduling
│   │   │   ├── customers/              # Customer directory & vehicle history
│   │   │   ├── enquiries/              # Inbound quote requests & callbacks
│   │   │   ├── bookings/               # Historical bookings archive & audit trail
│   │   │   ├── technicians/            # Mobile van fleet & technician roster
│   │   │   ├── emails/                 # Transactional email dispatch logs
│   │   │   ├── reviews/                # Google Reviews & customer ratings
│   │   │   ├── content/                # Website banners & emergency announcements
│   │   │   ├── services/               # Tyre services & callout pricing catalog
│   │   │   ├── locations/              # Postal zones & radial dispatch radius
│   │   │   ├── tyres/                  # Tyre dimensions & inventory catalog
│   │   │   ├── gallery/                # Roadside fitting photo showcase
│   │   │   ├── users/                  # Admin staff & role permission management
│   │   │   └── settings/               # System parameters & business hours
│   │   ├── api/
│   │   │   └── admin/
│   │   │       └── auth/
│   │   │           ├── login/route.ts  # Argon2id password authentication
│   │   │           ├── logout/route.ts # Session cookie clearing & revocation
│   │   │           └── me/route.ts     # Current session profile verification
│   ├── components/
│   │   ├── dashboard/                  # KPI cards, charts, live queues, quick actions
│   │   ├── forms/                      # Login form with role test fills
│   │   ├── layout/                     # Sidebar, Header, MobileNav, UserDropdown
│   │   └── ui/                         # Button, Card, Input, Badge, Table
│   ├── lib/
│   │   ├── api/                        # Standardized response envelopes & errors
│   │   ├── auth/                       # Argon2id password hashing & JWT session tokens
│   │   ├── config/                     # Server-only environment configuration
│   │   ├── db/                         # MongoDB Atlas Mongoose connection manager
│   │   └── validations/                # Zod schemas for input validation
│   ├── models/                         # Mongoose database models
│   │   ├── AdminUser.ts
│   │   ├── Session.ts
│   │   ├── Customer.ts
│   │   ├── Appointment.ts
│   │   ├── Enquiry.ts
│   │   └── index.ts
│   └── types/                          # TypeScript definitions for auth, CRM, dashboard
├── ARCHITECTURE.md                     # Comprehensive architecture documentation
├── DATABASE_DESIGN.md                  # Detailed Mongoose schemas & collection specifications
├── AUTHENTICATION_DESIGN.md            # Security model, Argon2id & RBAC matrix
├── API_ARCHITECTURE.md                 # Next.js Route Handlers specification
├── CRM_DEVELOPMENT_ROADMAP.md          # Multi-phase rollout roadmap
└── .env.example                        # Environment variables template
```

---

## 3. Getting Started

### Prerequisites
- Node.js 18.18+ or 20.x or 22.x
- MongoDB Atlas cluster URI or local MongoDB instance

### Installation
```bash
# Navigate to the admin project directory
cd mobiletyre-admin

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

### Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Default Development Credentials

For immediate Phase 1 demonstration and interface testing:
- **SuperAdmin:** `admin@mobiletyrechampions.com` / `AdminPassword123!`
- **Dispatcher:** `dispatch@mobiletyrechampions.com` / `DispatchPassword123!`
- **Content Manager:** `editor@mobiletyrechampions.com` / `EditorPassword123!`

---

## 5. Security Principles

1. **Zero Strapi Dependency:** Completely independent persistence and logic.
2. **HTTP-Only Cookies:** Auth tokens stored exclusively in encrypted, SameSite HTTP-only cookies.
3. **OWASP Argon2id:** Passwords hashed with standard Argon2id parameters (19 MiB memory, 2 iterations, 1 parallelism).
4. **Rate Limiting:** Brute force lockout protects the login route handler.
5. **Role-Based Access Control (RBAC):** SuperAdmin, Admin, Dispatcher, Viewer privilege tiers.
