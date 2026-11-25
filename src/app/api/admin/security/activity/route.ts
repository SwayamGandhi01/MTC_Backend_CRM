import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/db/mongodb";
import { SecurityEvent } from "@/models/SecurityEvent";
import { ActivityLog } from "@/models/ActivityLog";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("activity.view");
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));

    const [events, activities] = await Promise.all([
      SecurityEvent.find().sort({ createdAt: -1 }).limit(limit).lean(),
      ActivityLog.find().sort({ createdAt: -1 }).limit(limit).lean(),
    ]);

    const formattedEvents = events.map((e: any) => ({
      id: e._id.toString(),
      type: "SECURITY",
      event: e.eventType,
      actor: e.actorEmail || "System",
      severity: e.severity,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
      metadata: e.metadata,
      timestamp: e.createdAt,
    }));

    const formattedActivities = activities.map((a: any) => ({
      id: a._id.toString(),
      type: "OPERATIONAL",
      event: a.action,
      actor: a.actorName || "System",
      actorRole: a.actorRole,
      entityType: a.entityType,
      entityId: a.entityId,
      details: a.details,
      timestamp: a.createdAt,
    }));

    // Combined sorted feed
    const combined = [...formattedEvents, ...formattedActivities].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      items: combined.slice(0, limit),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
