import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AdminInvitation } from "@/models/AdminInvitation";
import { AdminUser } from "@/models/AdminUser";
import { SecurityEvent } from "@/models/SecurityEvent";
import { hashToken } from "@/lib/auth/crypto";
import { hashPassword } from "@/lib/auth/password";
import { createDatabaseSession } from "@/lib/auth/session";

const acceptSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
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
    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Password does not meet complexity requirements.",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 422 }
      );
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);

    await connectToDatabase();

    const invitation = await AdminInvitation.findOne({
      tokenHash,
      acceptedAt: null,
      revokedAt: null,
    });

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "This invitation link is invalid or has already been used.",
          },
        },
        { status: 400 }
      );
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "This invitation link has expired. Please request a new invitation.",
          },
        },
        { status: 410 }
      );
    }

    // Find the user account
    const user = await AdminUser.findOne({ normalizedEmail: invitation.normalizedEmail });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "Associated account could not be found.",
          },
        },
        { status: 404 }
      );
    }

    // Hash password using Argon2id
    const passwordHash = await hashPassword(password);

    user.passwordHash = passwordHash;
    user.status = "ACTIVE";
    user.passwordChangedAt = new Date();
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await user.save();

    // Mark invitation accepted
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Create session
    await createDatabaseSession(user, { ipAddress: ip, userAgent });

    await SecurityEvent.create({
      actorUserId: user._id,
      actorEmail: user.email,
      eventType: "INVITATION_ACCEPTED",
      severity: "INFO",
      ipAddress: ip,
      userAgent,
      metadata: { role: user.role },
    });

    return NextResponse.json({
      success: true,
      message: "Account activated successfully. Welcome to Mobile Tyre Champions CRM!",
      redirectUrl: "/dashboard",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("[Accept Invitation Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal error processing invitation acceptance.",
        },
      },
      { status: 500 }
    );
  }
}
