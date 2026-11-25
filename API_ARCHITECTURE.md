# Mobile Tyre Champions – API Architecture & Route Handlers Specification

## 1. Architectural Philosophy

The Mobile Tyre Champions CRM employs Next.js 15 App Router **Route Handlers** to provide a unified, typed, and low-latency API surface:

- **Isolated Admin Namespace:** All administrative and operational endpoints reside exclusively under `/api/admin/*`.
- **Public Website Webhook Namespace:** Dedicated endpoints for incoming leads and appointments reside under `/api/webhooks/*` and `/api/inbound/*`.
- **Zero Legacy Passthroughs:** No proxying to Strapi or external legacy backends.
- **Strict Input Validation:** Every incoming payload is validated using Zod before touching business logic or the database layer.
- **Consistent Response Envelope:** Every response adheres to a strict JSON envelope format.

---

## 2. Standardized Response Envelope

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "664b0f92b...",
    "customerName": "James Wright",
    "status": "confirmed"
  },
  "message": "Appointment successfully confirmed"
}
```

### Error Response (`400`, `401`, `403`, `404`, `422`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid UK postcode format for Berkshire district"
  }
}
```

---

## 3. Core API Endpoint Matrix

### 3.1 Authentication & Session (`/api/admin/auth/*`)
| Method | Route | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/admin/auth/login` | Authenticate admin staff credentials with Argon2id | No |
| `POST` | `/api/admin/auth/logout` | Revoke session & clear HTTP-only cookie | Yes |
| `GET` | `/api/admin/auth/me` | Retrieve profile of currently authenticated user | Yes |

---

### 3.2 Appointments & Dispatch (`/api/admin/appointments/*`)
| Method | Route | Description | Min Role |
|---|---|---|:---:|
| `GET` | `/api/admin/appointments` | Paginated appointments list with status & zone filters | Viewer |
| `POST` | `/api/admin/appointments` | Create new appointment manually from phone dispatch | Dispatcher |
| `GET` | `/api/admin/appointments/[id]` | Full appointment detail with customer & vehicle profile | Viewer |
| `PATCH` | `/api/admin/appointments/[id]/status` | Update triage state (Pending -> Confirmed -> In Progress) | Dispatcher |
| `PATCH` | `/api/admin/appointments/[id]/assign` | Assign technician and mobile van to appointment | Dispatcher |
| `DELETE` | `/api/admin/appointments/[id]` | Cancel or archive appointment | SuperAdmin |

---

### 3.3 Customer Management (`/api/admin/customers/*`)
| Method | Route | Description | Min Role |
|---|---|---|:---:|
| `GET` | `/api/admin/customers` | Searchable customer list by phone, email, reg plate | Viewer |
| `POST` | `/api/admin/customers` | Register new customer profile | Dispatcher |
| `GET` | `/api/admin/customers/[id]` | Customer profile with full vehicle & fitting history | Viewer |
| `PATCH` | `/api/admin/customers/[id]` | Update customer notes, tags, or contact details | Dispatcher |

---

### 3.4 Inbound Enquiries (`/api/admin/enquiries/*`)
| Method | Route | Description | Min Role |
|---|---|---|:---:|
| `GET` | `/api/admin/enquiries` | Live inbound quote and callback request stream | Viewer |
| `PATCH` | `/api/admin/enquiries/[id]/status` | Update enquiry triage state | Dispatcher |
| `POST` | `/api/admin/enquiries/[id]/convert` | Convert enquiry directly into a scheduled appointment | Dispatcher |

---

### 3.5 Technicians & Fleet (`/api/admin/technicians/*`)
| Method | Route | Description | Min Role |
|---|---|---|:---:|
| `GET` | `/api/admin/technicians` | Active technician roster and van availability status | Viewer |
| `POST` | `/api/admin/technicians` | Register new technician or mobile fitting van | Admin |
| `PATCH` | `/api/admin/technicians/[id]/status` | Update technician on-duty / off-duty status | Dispatcher |

---

### 3.6 Communication & Emails (`/api/admin/emails/*`)
| Method | Route | Description | Min Role |
|---|---|---|:---:|
| `GET` | `/api/admin/emails` | Delivery log of all outbound customer notifications | Admin |
| `POST` | `/api/admin/emails/resend` | Re-trigger failed customer notification | Admin |
| `POST` | `/api/admin/emails/custom` | Send ad-hoc notification to customer | Dispatcher |
