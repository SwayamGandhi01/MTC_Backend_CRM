import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Session, ISession } from "@/models/Session";
import { AdminUser, IAdminUser } from "@/models/AdminUser";
import { Role } from "@/models/Role";
import { generateSecureToken, hashToken } from "./crypto";
import { DEFAULT_SYSTEM_ROLES, ALL_PERMISSION_KEYS } from "./permissions";

export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-mtc-admin-session"
    : "mtc_admin_session";

// 8 hours absolute lifetime
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
// 30 minutes idle timeout
export const SESSION_IDLE_TIMEOUT_SECONDS = 30 * 60;

export interface AuthenticatedContext {
  session: ISession;
  user: IAdminUser;
  permissions: string[];
}

/**
 * Creates a new MongoDB-backed server session and sets the HTTP-only secure cookie.
 */
export async function createDatabaseSession(
  user: IAdminUser,
  meta?: { ipAddress?: string; userAgent?: string; deviceLabel?: string }
): Promise<{ rawToken: string; session: ISession }> {
  await connectToDatabase();

  const rawToken = generateSecureToken(32); // 64 hex characters
  const tokenHash = hashToken(rawToken);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

  const session = await Session.create({
    userId: user._id,
    tokenHash: tokenHash,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: expiresAt,
    revokedAt: null,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
    deviceLabel: meta?.deviceLabel || (meta?.userAgent ? parseDevice(meta.userAgent) : "Web Browser"),
  });

  // Set HTTP-only secure cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return { rawToken, session };
}

/**
 * Validates the session cookie against MongoDB Atlas.
 * Enforces:
 * 1. Non-revoked status
 * 2. Absolute 8-hour expiry
 * 3. 30-minute idle timeout
 * 4. Active user status (ACTIVE)
 * 5. Sliding window lastActivityAt update
 */
export async function getCurrentSession(): Promise<AuthenticatedContext | null> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!rawToken) return null;

    await connectToDatabase();
    const tokenHash = hashToken(rawToken);

    const session = await Session.findOne({
      tokenHash,
      revokedAt: null,
    });

    if (!session) return null;

    const now = Date.now();

    // Check absolute expiration
    if (session.expiresAt.getTime() <= now) {
      return null;
    }

    // Check 30-minute idle timeout
    const idleLimit = session.lastActivityAt.getTime() + SESSION_IDLE_TIMEOUT_SECONDS * 1000;
    if (now > idleLimit) {
      // Mark session revoked due to idle timeout
      session.revokedAt = new Date();
      session.revokedReason = "IDLE_TIMEOUT";
      await session.save();
      return null;
    }

    // Load user account
    const user = await AdminUser.findById(session.userId);
    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    // Update last activity (throttled to once every 60 seconds)
    if (now - session.lastActivityAt.getTime() > 60 * 1000) {
      session.lastActivityAt = new Date();
      await session.save();
    }

    // Resolve permissions
    let permissions: string[] = [];
    if (user.isSuperAdmin || user.role === "superadmin") {
      permissions = ALL_PERMISSION_KEYS;
    } else if (user.roleId) {
      const roleDoc = await Role.findById(user.roleId);
      permissions = roleDoc?.permissions || DEFAULT_SYSTEM_ROLES[user.role]?.permissions || [];
    } else if (DEFAULT_SYSTEM_ROLES[user.role]) {
      permissions = DEFAULT_SYSTEM_ROLES[user.role].permissions;
    }

    return { session, user, permissions };
  } catch (error) {
    console.error("[Session Lookup Error]", error);
    return null;
  }
}

/**
 * Revokes the current session and clears the cookie.
 */
export async function destroyCurrentSession(reason = "USER_LOGOUT"): Promise<void> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (rawToken) {
      await connectToDatabase();
      const tokenHash = hashToken(rawToken);
      await Session.findOneAndUpdate(
        { tokenHash, revokedAt: null },
        { revokedAt: new Date(), revokedReason: reason }
      );
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (err) {
    console.error("[Session Destroy Error]", err);
  }
}

/**
 * Revokes a specific session by ID.
 */
export async function revokeSessionById(sessionId: string, reason = "ADMIN_REVOCATION"): Promise<boolean> {
  await connectToDatabase();
  const res = await Session.findByIdAndUpdate(sessionId, {
    revokedAt: new Date(),
    revokedReason: reason,
  });
  return !!res;
}

/**
 * Revokes all active sessions for a user (e.g., password change or account deactivation).
 */
export async function revokeAllSessionsForUser(userId: string, reason = "ACCOUNT_SECURITY_ACTION"): Promise<number> {
  await connectToDatabase();
  const res = await Session.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date(), revokedReason: reason }
  );
  return res.modifiedCount;
}

function parseDevice(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return "Mobile Device";
  if (/iPad|tablet/i.test(userAgent)) return "Tablet";
  if (/Macintosh/i.test(userAgent)) return "macOS Desktop";
  if (/Windows/i.test(userAgent)) return "Windows PC";
  if (/Linux/i.test(userAgent)) return "Linux PC";
  return "Web Browser";
}
