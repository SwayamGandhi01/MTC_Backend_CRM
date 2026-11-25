import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { SecurityEvent } from "@/models/SecurityEvent";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await requirePermission("users.update");
    const { id } = await params;

    await connectToDatabase();
    const targetUser = await AdminUser.findById(id);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    targetUser.status = "ACTIVE";
    targetUser.failedLoginAttempts = 0;
    targetUser.lockUntil = undefined;
    await targetUser.save();

    await SecurityEvent.create({
      actorUserId: authContext.user._id,
      actorEmail: authContext.user.email,
      eventType: "USER_REACTIVATED",
      severity: "INFO",
      metadata: { targetUserId: targetUser._id.toString(), targetEmail: targetUser.email },
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} has been reactivated.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
