import * as argon2 from "@node-rs/argon2";
import bcrypt from "bcryptjs";

/**
 * Enterprise Password Hashing Service.
 * 
 * Uses Argon2id as recommended by OWASP for password hashing.
 * Backwards-compatible with bcrypt hashes.
 */

// OWASP recommended Argon2id parameters
const ARGON2_OPTIONS: argon2.Options = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

/**
 * Hash a plaintext password using Argon2id.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return await argon2.hash(plainText, ARGON2_OPTIONS);
}

export class PasswordVerificationError extends Error {
  code: string;
  constructor(message: string, code = "AUTH_PASSWORD_RUNTIME_ERROR") {
    super(message);
    this.name = "PasswordVerificationError";
    this.code = code;
  }
}

/**
 * Verify a plaintext password against an Argon2id or bcrypt hash.
 * 
 * - Normal password mismatch returns boolean false.
 * - Native runtime binding failure, corruption, or missing modules throw PasswordVerificationError
 *   with code AUTH_PASSWORD_RUNTIME_ERROR to prevent masking runtime crashes as wrong passwords.
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  if (!hash || typeof hash !== "string") {
    console.error("[AUTH_PASSWORD_RUNTIME_ERROR] Missing or invalid password hash provided for verification.");
    throw new PasswordVerificationError("Invalid hash format", "AUTH_PASSWORD_RUNTIME_ERROR");
  }

  try {
    if (hash.startsWith("$argon2")) {
      return await argon2.verify(hash, plainText);
    }
    // Fallback support for bcrypt hashes
    if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
      return await bcrypt.compare(plainText, hash);
    }
    console.error("[AUTH_PASSWORD_RUNTIME_ERROR] Unrecognized hash algorithm prefix.");
    throw new PasswordVerificationError("Unrecognized hash format", "AUTH_PASSWORD_RUNTIME_ERROR");
  } catch (error: any) {
    if (error instanceof PasswordVerificationError) {
      throw error;
    }
    console.error(`[AUTH_PASSWORD_RUNTIME_ERROR] Password verification subsystem failure: ${error?.message || error?.name || "Unknown error"}`);
    throw new PasswordVerificationError(
      `Password verification subsystem failure: ${error?.name || "Error"}`,
      "AUTH_PASSWORD_RUNTIME_ERROR"
    );
  }
}
