/**
 * Centralized Permission Registry & Role Definitions
 * 
 * Consistent permission format: module.action
 * All CRM modules, actions, and system roles are defined here.
 */

export interface PermissionDefinition {
  key: string;
  module: string;
  action: string;
  description: string;
}

export const PERMISSION_REGISTRY: Record<string, PermissionDefinition> = {
  // 1. Dashboard
  "dashboard.view": {
    key: "dashboard.view",
    module: "Dashboard",
    action: "View",
    description: "View executive KPIs, operational charts, and dispatch metrics",
  },

  // 2. Appointments
  "appointments.view": {
    key: "appointments.view",
    module: "Appointments",
    action: "View",
    description: "View appointment bookings and triage queues",
  },
  "appointments.create": {
    key: "appointments.create",
    module: "Appointments",
    action: "Create",
    description: "Create appointments manually on behalf of customers",
  },
  "appointments.update": {
    key: "appointments.update",
    module: "Appointments",
    action: "Update",
    description: "Update appointment status, timing, and customer details",
  },
  "appointments.assign": {
    key: "appointments.assign",
    module: "Appointments",
    action: "Assign",
    description: "Assign field technicians and mobile fitting vans",
  },
  "appointments.delete": {
    key: "appointments.delete",
    module: "Appointments",
    action: "Delete",
    description: "Cancel or purge appointment records",
  },
  "appointments.export": {
    key: "appointments.export",
    module: "Appointments",
    action: "Export",
    description: "Export appointment data to CSV or Excel",
  },

  // 3. Customers
  "customers.view": {
    key: "customers.view",
    module: "Customers",
    action: "View",
    description: "View customer profiles, vehicle fleet, and submission history",
  },
  "customers.create": {
    key: "customers.create",
    module: "Customers",
    action: "Create",
    description: "Create customer accounts manually",
  },
  "customers.update": {
    key: "customers.update",
    module: "Customers",
    action: "Update",
    description: "Update customer contact information and vehicle registrations",
  },
  "customers.export": {
    key: "customers.export",
    module: "Customers",
    action: "Export",
    description: "Export customer records",
  },

  // 4. Enquiries & Callbacks
  "enquiries.view": {
    key: "enquiries.view",
    module: "Enquiries",
    action: "View",
    description: "View customer contact messages and callback requests",
  },
  "enquiries.update": {
    key: "enquiries.update",
    module: "Enquiries",
    action: "Update",
    description: "Update enquiry and callback resolution status",
  },

  // 5. Postcode Availability
  "availability.view": {
    key: "availability.view",
    module: "Availability",
    action: "View",
    description: "View postcode availability lookup metrics and unserved areas",
  },

  // 6. Technicians & Fleet
  "technicians.view": {
    key: "technicians.view",
    module: "Technicians",
    action: "View",
    description: "View active mobile vans and technician schedules",
  },
  "technicians.manage": {
    key: "technicians.manage",
    module: "Technicians",
    action: "Manage",
    description: "Add, edit, or decommission technicians and fitting vans",
  },

  // 7. Communications & Emails
  "emails.view": {
    key: "emails.view",
    module: "Emails",
    action: "View",
    description: "View transactional email logs, dispatch confirmations, and delivery status",
  },
  "emails.manage": {
    key: "emails.manage",
    module: "Emails",
    action: "Manage",
    description: "Resend emails and configure transactional templates",
  },

  // 8. Content & Catalog
  "content.view": {
    key: "content.view",
    module: "Content",
    action: "View",
    description: "View website content drafts, blogs, and FAQ items",
  },
  "content.create": {
    key: "content.create",
    module: "Content",
    action: "Create",
    description: "Draft new blog articles and landing page copy",
  },
  "content.update": {
    key: "content.update",
    module: "Content",
    action: "Update",
    description: "Edit existing articles and website sections",
  },
  "content.publish": {
    key: "content.publish",
    module: "Content",
    action: "Publish",
    description: "Publish content live to the website frontend",
  },

  // 9. Services & Locations
  "services.manage": {
    key: "services.manage",
    module: "Services",
    action: "Manage",
    description: "Configure service offerings, pricing tiers, and callout fees",
  },
  "locations.manage": {
    key: "locations.manage",
    module: "Locations",
    action: "Manage",
    description: "Configure service hub postcodes, radius boundaries, and coverage zones",
  },
  "tyres.manage": {
    key: "tyres.manage",
    module: "Tyres",
    action: "Manage",
    description: "Manage tyre catalog brands, sizes, seasonal ratings, and pricing",
  },
  "gallery.manage": {
    key: "gallery.manage",
    module: "Gallery",
    action: "Manage",
    description: "Manage roadside fitting showcase gallery images",
  },
  "reviews.manage": {
    key: "reviews.manage",
    module: "Reviews",
    action: "Manage",
    description: "Moderate and feature customer testimonials and Google reviews",
  },

  // 10. Administration & Security
  "users.view": {
    key: "users.view",
    module: "Users",
    action: "View",
    description: "View CRM employee directory, roles, and account statuses",
  },
  "users.invite": {
    key: "users.invite",
    module: "Users",
    action: "Invite",
    description: "Generate invitation links for new employees",
  },
  "users.update": {
    key: "users.update",
    module: "Users",
    action: "Update",
    description: "Update employee profile details and role assignments",
  },
  "users.deactivate": {
    key: "users.deactivate",
    module: "Users",
    action: "Deactivate",
    description: "Suspend or deactivate employee accounts",
  },
  "users.manage": {
    key: "users.manage",
    module: "Users",
    action: "Manage",
    description: "Full user administration permissions",
  },
  "roles.view": {
    key: "roles.view",
    module: "Roles",
    action: "View",
    description: "View system and custom roles and assigned permissions",
  },
  "roles.manage": {
    key: "roles.manage",
    module: "Roles",
    action: "Manage",
    description: "Create, customize, and delete custom role definitions",
  },
  "sessions.view": {
    key: "sessions.view",
    module: "Sessions",
    action: "View",
    description: "View active employee login sessions across devices",
  },
  "sessions.revoke": {
    key: "sessions.revoke",
    module: "Sessions",
    action: "Revoke",
    description: "Terminate active employee sessions immediately",
  },
  "settings.manage": {
    key: "settings.manage",
    module: "Settings",
    action: "Manage",
    description: "Configure system-wide CRM parameters, email SMTP, and business rules",
  },
  "activity.view": {
    key: "activity.view",
    module: "Activity",
    action: "View",
    description: "View security audit logs, authentication history, and administrative actions",
  },
};

export const ALL_PERMISSION_KEYS = Object.keys(PERMISSION_REGISTRY);

export interface SystemRoleDefinition {
  name: string;
  slug: string;
  description: string;
  permissions: string[];
}

export const DEFAULT_SYSTEM_ROLES: Record<string, SystemRoleDefinition> = {
  superadmin: {
    name: "Super Admin",
    slug: "superadmin",
    description: "Unrestricted operational, security, and administrative access across all CRM modules",
    permissions: ALL_PERMISSION_KEYS,
  },
  dispatcher: {
    name: "Dispatcher",
    slug: "dispatcher",
    description: "Operational management of appointments, triage queues, technician assignment, and customer enquiries",
    permissions: [
      "dashboard.view",
      "appointments.view",
      "appointments.create",
      "appointments.update",
      "appointments.assign",
      "appointments.export",
      "customers.view",
      "customers.create",
      "customers.update",
      "enquiries.view",
      "enquiries.update",
      "availability.view",
      "technicians.view",
      "emails.view",
    ],
  },
  contenteditor: {
    name: "Content Editor",
    slug: "contenteditor",
    description: "Manages public website articles, services, customer reviews, and showcase media gallery",
    permissions: [
      "dashboard.view",
      "content.view",
      "content.create",
      "content.update",
      "content.publish",
      "services.manage",
      "gallery.manage",
      "reviews.manage",
    ],
  },
};
