# Mobile Tyre Champions – Authentication & Security Design

## 1. Security Architecture Principles

The Mobile Tyre Champions CRM enforces an enterprise-grade security model tailored for high-trust automotive dispatch operations:

1. **Independent Credential Isolation:** The CRM maintains its own distinct administrative identity store. No third-party or legacy credentials are exchanged.
2. **OWASP Argon2id Password Standards:** State-of-the-art password hashing using `@node-rs/argon2` with high memory-hardness parameters (19 MiB memory cost, 2 iterations, 1 parallelism).
3. **HTTP-Only Encrypted Session Cookies:** Session tokens are transmitted exclusively in `HttpOnly`, `SameSite=Lax` (or `Strict`), and `Secure` (in production) cookies.
4. **Stateless JWT Signatures:** Sessions are signed cryptographically using `jose` with HS256 and verified on every server request.
5. **Brute Force Protection:** IP and account-based rate limiting with automatic progressive delay and 15-minute temporary lockout after 5 consecutive failures.

---

## 2. Password Hashing Specification

Implemented in `src/lib/auth/password.ts`:

```typescript
import * as argon2 from "@node-rs/argon2";

const ARGON2_OPTIONS: argon2.Options = {
  algorithm: argon2.Algorithm.Argon2id, // Argon2id variant (resistant to GPU and side-channel attacks)
  memoryCost: 19456,                    // 19 MiB
  timeCost: 2,                          // 2 iterations
  parallelism: 1,                       // 1 thread
};
```

---

## 3. Session Lifecycle & Token Structure

### Session Cookie Attributes
- **Name:**
  - Production (HTTPS): `__Host-mtc-admin-session`
  - Development (HTTP localhost): `mtc_admin_session`
- **HttpOnly:** `true` (unreadable via JavaScript `document.cookie`)
- **SameSite:** `lax`
- **Secure:** `true` in production (`NODE_ENV === "production"`)
- **Path:** `/`
- **MaxAge:** 86,400 seconds (24 hours) or 604,800 seconds (7 days with Remember Me)

### JWT Payload Schema
```json
{
  "userId": "usr_664b0f92...",
  "email": "admin@mobiletyrechampions.com",
  "name": "Operations Lead (Admin)",
  "role": "SuperAdmin",
  "iat": 1732356000,
  "exp": 1732442400
}
```

---

## 4. Role-Based Access Control (RBAC) Matrix

| Module | SuperAdmin | Admin | Dispatcher | Viewer |
|---|:---:|:---:|:---:|:---:|
| **Overview Dashboard** | Full | Full | Full | Read Only |
| **Appointments (Triage & Status)** | Full | Full | Full | Read Only |
| **Appointments (Delete/Purge)** | Full | No | No | No |
| **Customers Directory** | Full | Full | Read/Update | Read Only |
| **Enquiries Management** | Full | Full | Full | Read Only |
| **Bookings Archive** | Full | Full | Read Only | Read Only |
| **Technicians & Van Fleet** | Full | Full | Status/Assign | Read Only |
| **Email Centre Logs** | Full | Full | View Only | No |
| **Google Reviews** | Full | Full | View Only | Read Only |
| **Website Content & Banners** | Full | Full | No | No |
| **Services & Callout Pricing** | Full | Full | No | No |
| **Locations & Coverage Zones** | Full | Full | No | Read Only |
| **Tyre Inventory Catalog** | Full | Full | Read Only | Read Only |
| **Fittings Gallery Showcase** | Full | Full | No | Read Only |
| **Admin User Accounts** | Full | No | No | No |
| **CRM System Settings** | Full | No | No | No |

---

## 5. Security Endpoints

- `POST /api/admin/auth/login`: Authenticates credentials with Argon2id and sets HTTP-only session cookie.
- `POST /api/admin/auth/logout`: Clears session cookie and invalidates session token.
- `GET /api/admin/auth/me`: Verifies active session token and returns sanitized user profile.
