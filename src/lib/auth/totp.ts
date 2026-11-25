import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";
import { encryptMfaSecret, decryptMfaSecret } from "./crypto";

/**
 * Enterprise TOTP Multi-Factor Authentication Service
 * 
 * Implements RFC 6238 Time-Based One-Time Passwords compatible with:
 * - Google Authenticator
 * - Microsoft Authenticator
 * - 1Password / Bitwarden / Apple Passwords
 */

export interface TotpSetupResult {
  secretBase32: string;
  encryptedSecret: string;
  otpauthUri: string;
  qrCodeDataUrl: string;
}

/**
 * Generates a new cryptographically random TOTP secret, otpauth URI, and QR code data URL.
 */
export async function generateTotpSetup(email: string): Promise<TotpSetupResult> {
  const totp = new TOTP({
    issuer: "Mobile Tyre Champions CRM",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: new Secret({ size: 20 }),
  });

  const secretBase32 = totp.secret.base32;
  const encryptedSecret = encryptMfaSecret(secretBase32);
  const otpauthUri = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
    margin: 2,
    width: 256,
    color: {
      dark: "#0C162D",
      light: "#FFFFFF",
    },
  });

  return {
    secretBase32,
    encryptedSecret,
    otpauthUri,
    qrCodeDataUrl,
  };
}

/**
 * Verifies a 6-digit TOTP token against an encrypted TOTP secret.
 * Allows a +/- 1 window (30s clock drift protection).
 */
export function verifyTotpToken(encryptedSecret: string, token: string): boolean {
  try {
    let secretBase32: string;
    try {
      secretBase32 = decryptMfaSecret(encryptedSecret);
    } catch (decryptErr: any) {
      console.error("[AUTH_MFA_DECRYPTION_FAILED] Unable to decrypt MFA secret with active MFA_ENCRYPTION_KEY:", decryptErr?.name || "DecryptionError");
      return false;
    }

    const totp = new TOTP({
      issuer: "Mobile Tyre Champions CRM",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secretBase32),
    });

    // delta returns null if invalid, or integer offset (e.g. 0, -1, 1) if valid
    const delta = totp.validate({ token: token.trim(), window: 1 });
    return delta !== null;
  } catch (err: any) {
    console.error("[AUTH_MFA_VERIFICATION_FAILED] TOTP verification subsystem error:", err?.name || "TotpError");
    return false;
  }
}
