import { SignJWT, jwtVerify } from "jose";
import { getServerEnv } from "@/lib/config/env";

export interface MfaChallengePayload {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
  mfaEnabled: boolean;
  type: "mfa_challenge";
}

function getMfaChallengeSecret(): Uint8Array {
  const env = getServerEnv();
  return new TextEncoder().encode(env.SESSION_SECRET + "_mfa_challenge");
}

/**
 * Creates a short-lived (5 minute) restricted MFA challenge token.
 */
export async function createMfaChallengeToken(
  userId: string,
  email: string,
  isSuperAdmin: boolean,
  mfaEnabled: boolean
): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 5 * 60; // 5 minutes

  return new SignJWT({
    userId,
    email,
    isSuperAdmin,
    mfaEnabled,
    type: "mfa_challenge",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .setIssuer("mtc-admin-mfa")
    .setAudience("mtc-admin-portal")
    .sign(getMfaChallengeSecret());
}

/**
 * Verifies and decodes the short-lived MFA challenge token.
 */
export async function verifyMfaChallengeToken(token: string): Promise<MfaChallengePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getMfaChallengeSecret(), {
      issuer: "mtc-admin-mfa",
      audience: "mtc-admin-portal",
    });

    if (payload.type !== "mfa_challenge") {
      return null;
    }

    return payload as unknown as MfaChallengePayload;
  } catch {
    return null;
  }
}
