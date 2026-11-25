import crypto from "crypto";

/**
 * Enterprise Cryptographic Utility Service.
 * 
 * Provides:
 * 1. AES-256-GCM authenticated encryption/decryption for TOTP MFA secrets.
 * 2. Cryptographic SHA-256 hashing for opaque tokens (sessions, invitations, resets).
 * 3. Secure random token generation.
 * 4. Recovery code generation and single-use verification.
 */

function getMfaKey(): Buffer {
  const hexKey = process.env.MFA_ENCRYPTION_KEY?.trim();
  if (!hexKey) {
    throw new Error("[Crypto] MFA_ENCRYPTION_KEY environment variable is missing.");
  }
  // Ensure 32 bytes (256-bit)
  if (hexKey.length === 64) {
    return Buffer.from(hexKey, "hex");
  }
  return crypto.createHash("sha256").update(hexKey).digest();
}

/**
 * Encrypt a plaintext TOTP secret using AES-256-GCM.
 * Output format: iv:authTag:encryptedHex
 */
export function encryptMfaSecret(plainSecret: string): string {
  const key = getMfaKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plainSecret, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted TOTP secret.
 */
export function decryptMfaSecret(encryptedPayload: string): string {
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("[Crypto] Invalid encrypted payload format.");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getMfaKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Hashes an opaque token using SHA-256 for secure database lookup.
 * Raw tokens are never stored in the database.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Generates a cryptographically secure random token (hex-encoded).
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Generates an array of secure 10-character alphanumeric recovery codes
 * and their SHA-256 hashes for storage.
 */
export function generateRecoveryCodes(count = 8): { rawCodes: string[]; hashedCodes: string[] } {
  const rawCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    // 5 bytes = 10 hex characters formatted as XXXXX-XXXXX
    const codeBytes = crypto.randomBytes(5).toString("hex").toUpperCase();
    const formattedCode = `${codeBytes.slice(0, 5)}-${codeBytes.slice(5)}`;
    rawCodes.push(formattedCode);
    hashedCodes.push(hashToken(formattedCode.replace(/[\s-]/g, "").toUpperCase()));
  }

  return { rawCodes, hashedCodes };
}

/**
 * Verifies a recovery code against stored hashes.
 * If valid, removes the consumed hash to guarantee single-use.
 */
export function verifyAndConsumeRecoveryCode(
  rawInputCode: string,
  storedHashedCodes: string[]
): { valid: boolean; remainingHashedCodes: string[] } {
  const normalizedInput = rawInputCode.replace(/[\s-]/g, "").toUpperCase();
  const inputHash = hashToken(normalizedInput);

  const matchedIndex = storedHashedCodes.findIndex((h) => h === inputHash);
  if (matchedIndex === -1) {
    return { valid: false, remainingHashedCodes: storedHashedCodes };
  }

  // Remove the consumed code
  const remainingHashedCodes = storedHashedCodes.filter((_, idx) => idx !== matchedIndex);
  return { valid: true, remainingHashedCodes };
}
