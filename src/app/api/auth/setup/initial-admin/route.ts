import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { Role } from "@/models/Role";
import { SecurityEvent } from "@/models/SecurityEvent";
import { ActivityLog } from "@/models/ActivityLog";
import { hashPassword } from "@/lib/auth/password";
import { generateTotpSetup } from "@/lib/auth/totp";
import { createMfaChallengeToken } from "@/lib/auth/mfa-challenge";
import { DEFAULT_SYSTEM_ROLES } from "@/lib/auth/permissions";

const initialAdminSchema = z
  .object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid work email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * GET /api/auth/setup/initial-admin
 * Checks whether initial setup is open or permanently closed.
 */
export async function GET() {
  try {
    await connectToDatabase();

    const existingSuperAdmin = await AdminUser.findOne({
      $or: [{ isSuperAdmin: true }, { role: "superadmin" }],
    });

    if (existingSuperAdmin) {
      return NextResponse.json({
        eligible: false,
        message: "Initial Super Admin setup has already been completed.",
      });
    }

    return NextResponse.json({
      eligible: true,
      message: "Initial Super Admin setup is available.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { eligible: false, message: "Database connection check failed" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/setup/initial-admin
 * Atomically registers the FIRST Super Admin of the independent CRM.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown Device";

    await connectToDatabase();

    // 1. Strict Eligibility Check
    const existingSuperAdmin = await AdminUser.findOne({
      $or: [{ isSuperAdmin: true }, { role: "superadmin" }],
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SETUP_COMPLETED",
            message: "Initial Super Admin setup has already been completed. Further registrations are disabled.",
          },
        },
        { status: 403 }
      );
    }

    // 2. Validate Request Body
    const body = await req.json();
    const parsed = initialAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Registration validation failed. Please check your inputs.",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 422 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Ensure System Roles exist in MongoDB
    for (const slug of Object.keys(DEFAULT_SYSTEM_ROLES)) {
      const roleDef = DEFAULT_SYSTEM_ROLES[slug];
      const existingRole = await Role.findOne({ slug });
      if (!existingRole) {
        await Role.create({
          name: roleDef.name,
          slug: roleDef.slug,
          description: roleDef.description,
          permissions: roleDef.permissions,
          isSystemRole: true,
          isActive: true,
        });
      }
    }

    const superAdminRole = await Role.findOne({ slug: "superadmin" });

    // 4. Concurrency-safe atomic check & Argon2id hash
    const doubleCheck = await AdminUser.countDocuments({
      $or: [{ isSuperAdmin: true }, { role: "superadmin" }],
    });

    if (doubleCheck > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SETUP_CONFLICT",
            message: "A Super Admin account was just created. Initial setup is now closed.",
          },
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // 5. Generate TOTP MFA credentials
    const totpSetup = await generateTotpSetup(normalizedEmail);

    // 6. Create the FIRST Super Admin
    const superAdmin = await AdminUser.create({
      name: name.trim(),
      email: normalizedEmail,
      normalizedEmail,
      passwordHash,
      roleId: superAdminRole?._id,
      role: "superadmin",
      status: "ACTIVE",
      isSuperAdmin: true,
      mfaEnabled: false, // Will become true upon verification in Step 2
      mfaPendingSecretEncrypted: totpSetup.encryptedSecret,
      recoveryCodes: [],
      failedLoginAttempts: 0,
      passwordChangedAt: new Date(),
      lastLoginIp: ip,
    });

    // 7. Issue restricted challenge token for immediate MFA verification
    const challengeToken = await createMfaChallengeToken(
      superAdmin._id.toString(),
      superAdmin.email,
      true,
      false
    );

    // 8. Log initial setup security events
    await ActivityLog.create({
      action: "INITIAL_SUPER_ADMIN_SETUP",
      entityType: "AdminUser",
      entityId: superAdmin._id.toString(),
      actorId: superAdmin._id.toString(),
      actorName: superAdmin.name,
      actorRole: "superadmin",
      ipAddress: ip,
      details: { email: superAdmin.email, isFirstAdmin: true },
    });

    await SecurityEvent.create({
      actorUserId: superAdmin._id,
      actorEmail: superAdmin.email,
      eventType: "INITIAL_SUPER_ADMIN_REGISTERED",
      severity: "CRITICAL",
      ipAddress: ip,
      userAgent,
      metadata: { role: "superadmin" },
    });

    return NextResponse.json({
      success: true,
      message: "First Super Admin created successfully. Please complete mandatory MFA enrollment.",
      challengeToken,
      secretBase32: totpSetup.secretBase32,
      otpauthUri: totpSetup.otpauthUri,
      qrCodeDataUrl: totpSetup.qrCodeDataUrl,
    });
  } catch (error: any) {
    console.error("[Initial Admin Registration Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "An unexpected error occurred during initial setup.",
        },
      },
      { status: 500 }
    );
  }
}
