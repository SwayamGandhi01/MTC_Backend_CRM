import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/db/mongodb";
import { EmailLog } from "@/models/EmailLog";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/emails
 * 
 * Returns paginated transactional email logs and delivery metrics.
 */
export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const originFilter = url.searchParams.get("origin");
  const search = url.searchParams.get("search");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25", 10), 100);
  const skip = (page - 1) * limit;

  // Build query
  const query: any = {};
  if (statusFilter && statusFilter !== "all") {
    query.status = { $regex: new RegExp(`^${statusFilter}$`, "i") };
  }

  if (originFilter && originFilter !== "all") {
    if (originFilter === "legacy") {
      query.$or = [{ origin: "legacy" }, { resendMessageId: { $exists: false } }];
    } else {
      query.origin = originFilter;
    }
  }

  if (startDate || endDate) {
    query.sentAt = {};
    if (startDate) query.sentAt.$gte = new Date(startDate);
    if (endDate) query.sentAt.$lte = new Date(endDate);
  }

  if (search) {
    const term = search.trim();
    query.$or = [
      { recipient: { $regex: term, $options: "i" } },
      { subject: { $regex: term, $options: "i" } },
      { referenceId: { $regex: term, $options: "i" } },
      { resendMessageId: { $regex: term, $options: "i" } },
      { providerMessageId: { $regex: term, $options: "i" } },
      { sender: { $regex: term, $options: "i" } },
    ];
  }

  const [
    emails,
    totalCount,
    totalAll,
    deliveredCount,
    bouncedCount,
    failedCount,
    openedCount,
    clickedCount,
    delayedCount,
    pendingCount,
    complaintCount,
  ] = await Promise.all([
    EmailLog.find(query).sort({ sentAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    EmailLog.countDocuments(query),
    EmailLog.countDocuments(),
    EmailLog.countDocuments({
      $or: [
        { status: { $in: ["Delivered", "Opened", "Clicked"] } },
        { "deliveryTimeline.event": { $in: ["email.delivered", "resend.delivered"] } },
      ],
    }),
    EmailLog.countDocuments({
      $or: [
        { status: "Bounced" },
        { "deliveryTimeline.event": { $in: ["email.bounced", "resend.bounced"] } },
      ],
    }),
    EmailLog.countDocuments({ status: "Failed" }),
    EmailLog.countDocuments({
      $or: [
        { status: "Opened" },
        { "deliveryTimeline.event": { $in: ["email.opened", "resend.opened"] } },
      ],
    }),
    EmailLog.countDocuments({
      $or: [
        { status: "Clicked" },
        { "deliveryTimeline.event": { $in: ["email.clicked", "resend.clicked"] } },
      ],
    }),
    EmailLog.countDocuments({ status: "Delayed" }),
    EmailLog.countDocuments({ status: { $in: ["Queued", "Sent", "Scheduled"] } }),
    EmailLog.countDocuments({ status: "Complained" }),
  ]);

  const deliveryRate = totalAll > 0 ? (deliveredCount / totalAll) * 100 : 100;

  return NextResponse.json({
    success: true,
    data: {
      metrics: {
        total: totalAll,
        delivered: deliveredCount,
        bounced: bouncedCount,
        failed: failedCount,
        opened: openedCount,
        clicked: clickedCount,
        delayed: delayedCount,
        pending: pendingCount,
        complaints: complaintCount,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
      },
      emails: emails.map((e: any) => ({
        id: e._id.toString(),
        recipient: e.recipient,
        subject: e.subject,
        templateName: e.templateName,
        status: e.status,
        origin: e.origin || (e.resendMessageId ? "crm" : "legacy"),
        sender: e.sender,
        category: e.category,
        referenceId: e.referenceId,
        resendMessageId: e.resendMessageId,
        providerMessageId: e.providerMessageId,
        relatedEntityType: e.relatedEntityType,
        relatedEntityId: e.relatedEntityId,
        errorMessage: e.errorMessage,
        deliveryTimeline: e.deliveryTimeline || [],
        metadata: e.metadata || {},
        sentAt: e.sentAt || e.createdAt,
        createdAt: e.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    },
  });
}
