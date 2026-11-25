import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { SecurityEvent } from "@/models/SecurityEvent";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await requirePermission("users.deactivate");
    const { id } = await params;

    await connectToDatabase();
    const targetUser = await AdminUser.findById(id);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    if (targetUser.isSuperAdmin) {
      const activeSuperAdmins = await AdminUser.countDocuments({
        isSuperAdmin: true,
        status: "ACTIVE",
      });
      if (activeSuperAdmins <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PROTECTED_ACTION",
              message: "Cannot suspend the only remaining Super Administrator account.",
            },
          },
          { status: 400 }
        );
      }
    }

    targetUser.status = "SUSPENDED";
    await targetUser.save();

    // Revoke all existing sessions
    await revokeAllSessionsForUser(targetUser._id.toString(), "ADMIN_SUSPENSION");

    await SecurityEvent.create({
      actorUserId: authContext.user._id,
      actorEmail: authContext.user.email,
      eventType: "USER_SUSPENDED",
      severity: "WARNING",
      metadata: { targetUserId: targetUser._id.toString(), targetEmail: targetUser.email },
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} has been suspended and all active sessions revoked.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
