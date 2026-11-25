import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { SecurityEvent } from "@/models/SecurityEvent";
import { hashToken } from "@/lib/auth/crypto";
import { hashPassword } from "@/lib/auth/password";
import { revokeAllSessionsForUser } from "@/lib/auth/session";

const resetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown Device";

    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Password does not meet complexity criteria.",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 422 }
      );
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);

    await connectToDatabase();

    const resetTokenDoc = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!resetTokenDoc) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "This password reset link is invalid or has expired.",
          },
        },
        { status: 400 }
      );
    }

    const user = await AdminUser.findById(resetTokenDoc.userId);
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_INACTIVE",
            message: "Associated account is inactive or not found.",
          },
        },
        { status: 403 }
      );
    }

    // Hash new password with Argon2id
    const newPasswordHash = await hashPassword(password);
    user.passwordHash = newPasswordHash;
    user.passwordChangedAt = new Date();
    await user.save();

    // Mark token used
    resetTokenDoc.usedAt = new Date();
    await resetTokenDoc.save();

    // Revoke all existing sessions for this user
    await revokeAllSessionsForUser(user._id.toString(), "PASSWORD_RESET");

    await SecurityEvent.create({
      actorUserId: user._id,
      actorEmail: user.email,
      eventType: "PASSWORD_RESET_COMPLETED",
      severity: "INFO",
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. Please log in with your new password.",
      redirectUrl: "/login",
    });
  } catch (error: any) {
    console.error("[Reset Password Error]", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
