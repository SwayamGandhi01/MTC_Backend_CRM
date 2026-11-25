import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Session } from "@/models/Session";
import { AdminUser } from "@/models/AdminUser";
import { revokeSessionById } from "@/lib/auth/session";

export async function GET() {
  try {
    await requirePermission("sessions.view");
    await connectToDatabase();

    const now = new Date();
    const sessions = await Session.find({
      revokedAt: null,
      expiresAt: { $gt: now },
    })
      .populate("userId", "name email role status")
      .sort({ lastActivityAt: -1 })
      .lean();

    const sanitized = sessions.map((s: any) => ({
      id: s._id.toString(),
      user: s.userId
        ? {
            id: s.userId._id?.toString(),
            name: s.userId.name,
            email: s.userId.email,
            role: s.userId.role,
          }
        : { name: "Unknown", email: "N/A" },
      deviceLabel: s.deviceLabel || "Web Browser",
      ipAddress: s.ipAddress || "127.0.0.1",
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastActivityAt: s.lastActivityAt,
      expiresAt: s.expiresAt,
    }));

    return NextResponse.json({
      success: true,
      sessions: sanitized,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePermission("sessions.revoke");
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: { message: "Session ID is required" } },
        { status: 400 }
      );
    }

    const ok = await revokeSessionById(sessionId, "ADMIN_REMOTE_REVOCATION");
    if (!ok) {
      return NextResponse.json(
        { success: false, error: { message: "Session not found or already revoked" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
