import { getCurrentSession, AuthenticatedContext } from "./session";
import { ForbiddenError, UnauthorizedError } from "../api/errors";
import { ALL_PERMISSION_KEYS } from "./permissions";

/**
 * Server-Side Authentication & Authorization Guards
 * 
 * Strict denier-by-default permission checks.
 */

/**
 * Requires an authenticated, active session.
 * Throws UnauthorizedError (401) if invalid or unauthenticated.
 */
export async function requireAuth(): Promise<AuthenticatedContext> {
  const context = await getCurrentSession();
  if (!context) {
    throw new UnauthorizedError("Valid administrator authentication is required.");
  }
  return context;
}

/**
 * Requires a specific permission (e.g., 'appointments.update').
 * Throws ForbiddenError (403) if user lacks the permission.
 * Super Admin accounts with isSuperAdmin=true bypass specific checks.
 */
export async function requirePermission(permission: string): Promise<AuthenticatedContext> {
  const context = await requireAuth();

  if (context.user.isSuperAdmin || context.user.role === "superadmin") {
    return context;
  }

  if (!context.permissions.includes(permission)) {
    throw new ForbiddenError(
      `Access denied. You do not have the required permission: [${permission}].`
    );
  }

  return context;
}

/**
 * Requires at least one of the specified permissions.
 */
export async function requireAnyPermission(permissions: string[]): Promise<AuthenticatedContext> {
  const context = await requireAuth();

  if (context.user.isSuperAdmin || context.user.role === "superadmin") {
    return context;
  }

  const hasAny = permissions.some((p) => context.permissions.includes(p));
  if (!hasAny) {
    throw new ForbiddenError(
      `Access denied. Required permissions: [${permissions.join(", ")}].`
    );
  }

  return context;
}

/**
 * Requires Super Admin privileges.
 */
export async function requireSuperAdmin(): Promise<AuthenticatedContext> {
  const context = await requireAuth();

  if (!context.user.isSuperAdmin && context.user.role !== "superadmin") {
    throw new ForbiddenError("Access denied. Super Administrator privileges are required.");
  }

  return context;
}

/**
 * Client-friendly helper to check if permissions array contains a permission.
 */
export function can(permissions: string[] | undefined, permission: string): boolean {
  if (!permissions) return false;
  if (permissions.includes("*") || permissions.length === ALL_PERMISSION_KEYS.length) {
    return true;
  }
  return permissions.includes(permission);
}
