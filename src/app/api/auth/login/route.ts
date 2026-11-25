import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { SecurityEvent } from "@/models/SecurityEvent";
import { verifyPassword } from "@/lib/auth/password";
import { createDatabaseSession } from "@/lib/auth/session";
import { createMfaChallengeToken } from "@/lib/auth/mfa-challenge";
import { generateTotpSetup } from "@/lib/auth/totp";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Simple in-memory rate limiting map for brute-force mitigation
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry) {
    loginAttempts.set(key, { count: 1, lastAttempt: now });
    return true;
  }
  if (now - entry.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(key, { count: 1, lastAttempt: now });
    return true;
  }
  if (entry.count >= 5) {
    return false;
  }
  entry.count += 1;
  entry.lastAttempt = now;
  return true;
}

function resetRateLimit(key: string) {
  loginAttempts.delete(key);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown Device";

    if (!checkRateLimit(`ip_${ip}`)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many failed login attempts. Please wait 15 minutes before trying again.",
          },
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid email or password format",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 422 }
      );
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();

    await connectToDatabase();
    const user = await AdminUser.findOne({ normalizedEmail });

    if (!user) {
      // Record failed attempt
      await SecurityEvent.create({
        actorEmail: normalizedEmail,
        eventType: "LOGIN_FAILED",
        severity: "WARNING",
        ipAddress: ip,
        userAgent,
        metadata: { reason: "Account not found" },
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status === "INVITED") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_INVITED",
            message: "Account has not been activated. Please use the invitation link sent to your email to set your password.",
          },
        },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED" || user.status === "DEACTIVATED") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_INACTIVE",
            message: "Your account has been deactivated or suspended. Please contact your system administrator.",
          },
        },
        { status: 403 }
      );
    }

    // Check lockUntil
    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message: "Account temporarily locked due to repeated failed attempts. Please try again later.",
          },
        },
        { status: 423 }
      );
    }

    // Verify Argon2id password
    const isPasswordValid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();

      await SecurityEvent.create({
        actorUserId: user._id,
        actorEmail: user.email,
        eventType: "LOGIN_FAILED",
        severity: "WARNING",
        ipAddress: ip,
        userAgent,
        metadata: { attempts: user.failedLoginAttempts },
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        },
        { status: 401 }
      );
    }

    // Password is valid - reset lock counters
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    resetRateLimit(`ip_${ip}`);

    // MFA Check: Mandatory for SuperAdmin, or if enabled
    if (user.isSuperAdmin || user.role === "superadmin" || user.mfaEnabled) {
      if (!user.mfaEnabled) {
        // SuperAdmin first-time setup requirement
        const totpSetup = await generateTotpSetup(user.email);
        user.mfaPendingSecretEncrypted = totpSetup.encryptedSecret;
        await user.save();

        const challengeToken = await createMfaChallengeToken(
          user._id.toString(),
          user.email,
          user.isSuperAdmin,
          false
        );

        return NextResponse.json({
          success: true,
          requireMfaSetup: true,
          challengeToken,
          secretBase32: totpSetup.secretBase32,
          otpauthUri: totpSetup.otpauthUri,
          qrCodeDataUrl: totpSetup.qrCodeDataUrl,
          message: "Multi-Factor Authentication enrollment is mandatory for Super Administrator accounts.",
        });
      } else {
        // Standard MFA challenge
        const challengeToken = await createMfaChallengeToken(
          user._id.toString(),
          user.email,
          user.isSuperAdmin,
          true
        );

        return NextResponse.json({
          success: true,
          requireMfa: true,
          challengeToken,
          message: "Please enter your 6-digit authenticator code.",
        });
      }
    }

    // Normal employee login without MFA
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await user.save();

    await createDatabaseSession(user, { ipAddress: ip, userAgent });

    await SecurityEvent.create({
      actorUserId: user._id,
      actorEmail: user.email,
      eventType: "LOGIN_SUCCESS",
      severity: "INFO",
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      redirectUrl: "/dashboard",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (error: any) {
    console.error("[Login Handler Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "An internal authentication error occurred.",
        },
      },
      { status: 500 }
    );
  }
}
