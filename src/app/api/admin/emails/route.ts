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
  const search = url.searchParams.get("search");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25", 10), 100);
  const skip = (page - 1) * limit;

  // Build query
  const query: any = {};
  if (statusFilter && statusFilter !== "all") {
    query.status = { $regex: new RegExp(`^${statusFilter}$`, "i") };
  }

  if (search) {
    const term = search.trim();
    query.$or = [
      { recipient: { $regex: term, $options: "i" } },
      { subject: { $regex: term, $options: "i" } },
      { referenceId: { $regex: term, $options: "i" } },
      { resendMessageId: { $regex: term, $options: "i" } },
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
  ] = await Promise.all([
    EmailLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    EmailLog.countDocuments(query),
    EmailLog.countDocuments(),
    EmailLog.countDocuments({ status: "Delivered" }),
    EmailLog.countDocuments({ status: { $in: ["Bounced", "Complained"] } }),
    EmailLog.countDocuments({ status: "Failed" }),
    EmailLog.countDocuments({ status: { $in: ["Opened", "Clicked"] } }),
  ]);

  const deliveryRate = totalAll > 0 ? ((deliveredCount + openedCount) / totalAll) * 100 : 100;

  return NextResponse.json({
    success: true,
    data: {
      metrics: {
        total: totalAll,
        delivered: deliveredCount,
        bounced: bouncedCount,
        failed: failedCount,
        opened: openedCount,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
      },
      emails: emails.map((e) => ({
        id: e._id.toString(),
        recipient: e.recipient,
        subject: e.subject,
        templateName: e.templateName,
        status: e.status,
        category: e.category,
        referenceId: e.referenceId,
        resendMessageId: e.resendMessageId,
        relatedEntityType: e.relatedEntityType,
        relatedEntityId: e.relatedEntityId,
        errorMessage: e.errorMessage,
        deliveryTimeline: e.deliveryTimeline || [],
        sentAt: e.sentAt,
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
