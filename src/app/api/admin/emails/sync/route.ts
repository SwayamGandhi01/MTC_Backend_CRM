import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/roles";
import { syncResendHistoricalEmails, getLatestSyncStatus } from "@/lib/email/resend-sync";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/emails/sync
 * 
 * Returns the latest Resend historical sync execution status and metadata.
 */
export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getLatestSyncStatus();
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to retrieve sync status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/emails/sync
 * 
 * Triggers a historical email synchronization from the connected Resend account.
 */
export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { resume?: boolean } = {};
  try {
    body = await req.json();
  } catch {}

  try {
    const result = await syncResendHistoricalEmails({
      triggeredBy: session.user.email || session.user.name || "admin",
      resume: Boolean(body?.resume),
    });

    return NextResponse.json({
      success: result.status === "completed",
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Historical email synchronization failed" },
      { status: 500 }
    );
  }
}
