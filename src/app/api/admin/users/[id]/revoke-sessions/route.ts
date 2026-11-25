import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/db/mongodb";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { SecurityEvent } from "@/models/SecurityEvent";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await requirePermission("sessions.revoke");
    const { id } = await params;

    await connectToDatabase();
    const count = await revokeAllSessionsForUser(id, "ADMIN_MANUAL_REVOCATION");

    await SecurityEvent.create({
      actorUserId: authContext.user._id,
      actorEmail: authContext.user.email,
      eventType: "USER_SESSIONS_REVOKED",
      severity: "INFO",
      metadata: { targetUserId: id, revokedCount: count },
    });

    return NextResponse.json({
      success: true,
      message: `Revoked ${count} active sessions.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
