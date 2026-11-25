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

/**
 * Verify a plaintext password against an Argon2id or bcrypt hash.
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  try {
    if (hash.startsWith("$argon2")) {
      return await argon2.verify(hash, plainText);
    }
    // Fallback support for bcrypt hashes
    if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
      return await bcrypt.compare(plainText, hash);
    }
    return false;
  } catch (error) {
    console.error("[Auth] Password verification error:", error);
    return false;
  }
}
