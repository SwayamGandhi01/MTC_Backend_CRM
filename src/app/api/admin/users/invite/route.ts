import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { AdminInvitation } from "@/models/AdminInvitation";
import { Role } from "@/models/Role";
import { SecurityEvent } from "@/models/SecurityEvent";
import { ActivityLog } from "@/models/ActivityLog";
import { generateSecureToken, hashToken } from "@/lib/auth/crypto";
import { hashPassword } from "@/lib/auth/password";
import { sendAuthEmail } from "@/lib/auth/email";

const inviteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  roleSlug: z.string().min(1, "Role is required"),
});

export async function POST(req: NextRequest) {
  try {
    const authContext = await requirePermission("users.invite");
    const body = await req.json();

    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 422 }
      );
    }

    const { name, email, roleSlug } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    await connectToDatabase();

    // Check if an active account already exists
    const existingUser = await AdminUser.findOne({ normalizedEmail });
    if (existingUser && existingUser.status === "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_ALREADY_EXISTS",
            message: "An active user with this email address already exists.",
          },
        },
        { status: 409 }
      );
    }

    // Resolve Role
    const roleDoc = await Role.findOne({ slug: roleSlug.toLowerCase() });
    if (!roleDoc && roleSlug !== "superadmin" && roleSlug !== "dispatcher" && roleSlug !== "contenteditor") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ROLE",
            message: `Role '${roleSlug}' does not exist.`,
          },
        },
        { status: 400 }
      );
    }

    // Revoke any outstanding previous invitations
    await AdminInvitation.updateMany(
      { normalizedEmail, acceptedAt: null, revokedAt: null },
      { revokedAt: new Date() }
    );

    // Generate secure token (32 bytes = 64 hex chars)
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);

    const expiryHours = parseInt(process.env.AUTH_INVITATION_EXPIRY_HOURS || "24", 10);
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const invitation = await AdminInvitation.create({
      email: normalizedEmail,
      normalizedEmail,
      name,
      roleId: roleDoc?._id,
      roleSlug: roleDoc?.slug || roleSlug,
      tokenHash,
      invitedBy: authContext.user._id,
      expiresAt,
    });

    // Create or update invited user shell
    if (!existingUser) {
      const dummyPassword = await hashPassword(generateSecureToken(32));
      await AdminUser.create({
        name,
        email: normalizedEmail,
        normalizedEmail,
        passwordHash: dummyPassword,
        roleId: roleDoc?._id,
        role: roleDoc?.slug || roleSlug,
        status: "INVITED",
        isSuperAdmin: roleSlug === "superadmin",
        mfaEnabled: false,
        recoveryCodes: [],
        invitedBy: authContext.user._id,
      });
    } else {
      existingUser.status = "INVITED";
      existingUser.roleId = roleDoc?._id;
      existingUser.role = roleDoc?.slug || roleSlug;
      existingUser.invitedBy = authContext.user._id;
      await existingUser.save();
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/accept-invitation?token=${rawToken}`;

    // Dispatch email
    await sendAuthEmail({
      to: normalizedEmail,
      subject: "You've been invited to Mobile Tyre Champions CRM",
      templateName: "employee_invitation",
      referenceId: invitation._id.toString(),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0C162D;">Welcome to Mobile Tyre Champions</h2>
          <p>Hi ${name},</p>
          <p>You have been invited by ${authContext.user.name} to join the Mobile Tyre Champions operations team as a <strong>${roleDoc?.name || roleSlug}</strong>.</p>
          <p>To activate your account and set your secure password, please click the button below:</p>
          <div style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #E67E22; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Activate My Account</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">This invitation link will expire in ${expiryHours} hours.</p>
        </div>
      `,
    });

    // Record audit logs
    await ActivityLog.create({
      action: "USER_INVITED",
      entityType: "AdminUser",
      entityId: invitation._id.toString(),
      actorId: authContext.user._id.toString(),
      actorName: authContext.user.name,
      actorRole: authContext.user.role,
      details: { email: normalizedEmail, role: roleSlug },
    });

    await SecurityEvent.create({
      actorUserId: authContext.user._id,
      actorEmail: authContext.user.email,
      eventType: "INVITATION_ISSUED",
      severity: "INFO",
      metadata: { recipientEmail: normalizedEmail, role: roleSlug },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation generated successfully for ${normalizedEmail}.`,
      invitation: {
        id: invitation._id.toString(),
        email: normalizedEmail,
        role: roleDoc?.name || roleSlug,
        expiresAt,
        inviteUrl, // Provided for direct verification
      },
    });
  } catch (error: any) {
    console.error("[Invite User Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.statusCode === 403 ? "FORBIDDEN" : "SERVER_ERROR",
          message: error.message || "Failed to process employee invitation.",
        },
      },
      { status: error.statusCode || 500 }
    );
  }
}
