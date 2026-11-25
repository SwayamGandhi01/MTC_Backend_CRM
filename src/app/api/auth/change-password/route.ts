import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/roles";
import { AdminUser } from "@/models/AdminUser";
import { SecurityEvent } from "@/models/SecurityEvent";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { revokeAllSessionsForUser } from "@/lib/auth/session";

const changeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(req: NextRequest) {
  try {
    const authContext = await requireAuth();
    const body = await req.json();

    const parsed = changeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "New password does not meet complexity criteria.",
          },
        },
        { status: 422 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await AdminUser.findById(authContext.user._id);
    if (!user) {
      return NextResponse.json({ success: false, error: { message: "User not found" } }, { status: 404 });
    }

    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CURRENT_PASSWORD",
            message: "The current password entered is incorrect.",
          },
        },
        { status: 400 }
      );
    }

    user.passwordHash = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    await user.save();

    await SecurityEvent.create({
      actorUserId: user._id,
      actorEmail: user.email,
      eventType: "PASSWORD_CHANGED",
      severity: "INFO",
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
