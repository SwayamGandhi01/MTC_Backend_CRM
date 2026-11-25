import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { Session } from "@/models/Session";
import { Role } from "@/models/Role";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { DEFAULT_SYSTEM_ROLES } from "@/lib/auth/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("users.view");
    const { id } = await params;

    await connectToDatabase();
    const user = await AdminUser.findById(id)
      .select("-passwordHash -mfaSecretEncrypted -mfaPendingSecretEncrypted -recoveryCodes")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    const activeSessionsCount = await Session.countDocuments({
      userId: user._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        id: user._id.toString(),
        activeSessionsCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await requirePermission("users.update");
    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();
    const targetUser = await AdminUser.findById(id);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Protection: Prevent demoting the last Super Admin
    if (targetUser.isSuperAdmin && body.role && body.role !== "superadmin") {
      const superAdminCount = await AdminUser.countDocuments({
        isSuperAdmin: true,
        status: "ACTIVE",
      });
      if (superAdminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PROTECTED_ACTION",
              message: "Cannot modify role of the last active Super Administrator.",
            },
          },
          { status: 400 }
        );
      }
    }

    if (body.name) targetUser.name = body.name.trim();

    if (body.role) {
      const roleSlug = body.role.toLowerCase();
      const roleDoc = await Role.findOne({ slug: roleSlug });
      targetUser.role = roleSlug;
      targetUser.roleId = roleDoc?._id;
      targetUser.isSuperAdmin = roleSlug === "superadmin";
    }

    if (body.status) {
      targetUser.status = body.status;
      if (body.status === "SUSPENDED" || body.status === "DEACTIVATED") {
        await revokeAllSessionsForUser(targetUser._id.toString(), "USER_STATUS_CHANGE");
      }
    }

    await targetUser.save();

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
        isSuperAdmin: targetUser.isSuperAdmin,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
