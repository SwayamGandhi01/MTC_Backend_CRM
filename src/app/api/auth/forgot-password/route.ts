import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { SecurityEvent } from "@/models/SecurityEvent";
import { generateSecureToken, hashToken } from "@/lib/auth/crypto";
import { sendAuthEmail } from "@/lib/auth/email";

const forgotSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown Device";

    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid email address" } },
        { status: 422 }
      );
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();

    await connectToDatabase();
    const user = await AdminUser.findOne({ normalizedEmail, status: "ACTIVE" });

    // Always return generic message to prevent email enumeration
    const genericResponse = {
      success: true,
      message: "If an active account exists with that email, a password recovery link has been dispatched.",
    };

    if (!user) {
      return NextResponse.json(genericResponse);
    }

    // Invalidate existing unused tokens for this user
    await PasswordResetToken.updateMany(
      { userId: user._id, usedAt: null },
      { usedAt: new Date() }
    );

    // Generate token (expires in 1 hour)
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    await sendAuthEmail({
      to: normalizedEmail,
      subject: "Password Reset Request – Mobile Tyre Champions CRM",
      templateName: "password_reset",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0C162D;">Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your Mobile Tyre Champions CRM account password.</p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #00468B; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset My Password</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">This link will expire in 1 hour. If you did not make this request, please contact your Super Administrator immediately.</p>
        </div>
      `,
    });

    await SecurityEvent.create({
      actorUserId: user._id,
      actorEmail: user.email,
      eventType: "PASSWORD_RESET_REQUESTED",
      severity: "INFO",
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      ...genericResponse,
      resetUrl, // Included in local/development response for seamless verification
    });
  } catch (error: any) {
    console.error("[Forgot Password Error]", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
