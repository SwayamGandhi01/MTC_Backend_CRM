import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { SecurityEvent } from "@/models/SecurityEvent";
import { verifyMfaChallengeToken } from "@/lib/auth/mfa-challenge";
import { verifyTotpToken } from "@/lib/auth/totp";
import { generateRecoveryCodes, verifyAndConsumeRecoveryCode } from "@/lib/auth/crypto";
import { createDatabaseSession } from "@/lib/auth/session";

const verifyMfaSchema = z.object({
  challengeToken: z.string().min(1, "Challenge token is required"),
  code: z.string().min(1, "Verification code or recovery code is required"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown Device";

    const body = await req.json();
    const parsed = verifyMfaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing challenge token or verification code.",
          },
        },
        { status: 422 }
      );
    }

    const { challengeToken, code } = parsed.data;

    // Verify restricted challenge token
    const tokenPayload = await verifyMfaChallengeToken(challengeToken);
    if (!tokenPayload) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHALLENGE_EXPIRED",
            message: "MFA challenge has expired. Please sign in again.",
          },
        },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const user = await AdminUser.findById(tokenPayload.userId);
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Account not found or inactive.",
          },
        },
        { status: 401 }
      );
    }

    // Branch A: First-time MFA setup enrollment
    if (!user.mfaEnabled && user.mfaPendingSecretEncrypted) {
      const isValidTotp = verifyTotpToken(user.mfaPendingSecretEncrypted, code);
      if (!isValidTotp) {
        await SecurityEvent.create({
          actorUserId: user._id,
          actorEmail: user.email,
          eventType: "MFA_SETUP_FAILED",
          severity: "WARNING",
          ipAddress: ip,
          userAgent,
        });

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_TOTP",
              message: "Invalid authenticator code. Please check your authenticator application time sync and try again.",
            },
          },
          { status: 400 }
        );
      }

      // Valid TOTP: finalize MFA setup & generate recovery codes
      user.mfaSecretEncrypted = user.mfaPendingSecretEncrypted;
      user.mfaPendingSecretEncrypted = null;
      user.mfaEnabled = true;
      user.mfaVerifiedAt = new Date();

      const recoveryCodes = generateRecoveryCodes(8);
      user.recoveryCodes = recoveryCodes.hashedCodes;

      user.lastLoginAt = new Date();
      user.lastLoginIp = ip;
      await user.save();

      // Establish authenticated database session
      await createDatabaseSession(user, { ipAddress: ip, userAgent });

      await SecurityEvent.create({
        actorUserId: user._id,
        actorEmail: user.email,
        eventType: "MFA_SETUP_SUCCESS",
        severity: "INFO",
        ipAddress: ip,
        userAgent,
        metadata: { recoveryCodesGenerated: recoveryCodes.rawCodes.length },
      });

      return NextResponse.json({
        success: true,
        redirectUrl: "/dashboard",
        mfaSetupCompleted: true,
        recoveryCodes: recoveryCodes.rawCodes,
        message: "MFA enrollment successful. Please store these recovery codes in a secure location.",
      });
    }

    // Branch B: Standard MFA Login Verification
    if (user.mfaEnabled && user.mfaSecretEncrypted) {
      // 1. Try TOTP code first
      const isValidTotp = verifyTotpToken(user.mfaSecretEncrypted, code);

      if (isValidTotp) {
        user.lastLoginAt = new Date();
        user.lastLoginIp = ip;
        await user.save();

        await createDatabaseSession(user, { ipAddress: ip, userAgent });

        await SecurityEvent.create({
          actorUserId: user._id,
          actorEmail: user.email,
          eventType: "LOGIN_SUCCESS_MFA",
          severity: "INFO",
          ipAddress: ip,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          redirectUrl: "/dashboard",
        });
      }

      // 2. Try Recovery Code fallback
      const recoveryCheck = verifyAndConsumeRecoveryCode(code, user.recoveryCodes || []);
      if (recoveryCheck.valid) {
        user.recoveryCodes = recoveryCheck.remainingHashedCodes;
        user.lastLoginAt = new Date();
        user.lastLoginIp = ip;
        await user.save();

        await createDatabaseSession(user, { ipAddress: ip, userAgent });

        await SecurityEvent.create({
          actorUserId: user._id,
          actorEmail: user.email,
          eventType: "LOGIN_SUCCESS_RECOVERY_CODE",
          severity: "WARNING",
          ipAddress: ip,
          userAgent,
          metadata: { remainingCodes: recoveryCheck.remainingHashedCodes.length },
        });

        return NextResponse.json({
          success: true,
          redirectUrl: "/dashboard",
          recoveryCodeUsed: true,
          remainingCodesCount: recoveryCheck.remainingHashedCodes.length,
          message: `Recovery code accepted. You have ${recoveryCheck.remainingHashedCodes.length} recovery codes remaining.`,
        });
      }

      // Both failed
      await SecurityEvent.create({
        actorUserId: user._id,
        actorEmail: user.email,
        eventType: "MFA_VERIFY_FAILED",
        severity: "WARNING",
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_MFA_CODE",
            message: "Invalid authentication code or recovery code. Please try again.",
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MFA_STATE_ERROR",
          message: "Account MFA is not properly configured.",
        },
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[MFA Verify Handler Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal error during MFA verification.",
        },
      },
      { status: 500 }
    );
  }
}
