import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import Ably from "ably";

export const dynamic = "force-dynamic";

/**
 * GET /api/realtime/token
 * 
 * Generates an authenticated Ably token request for the CRM dashboard.
 * Protects secrets on the server and restricts clients to private channels.
 */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ABLY_API_KEY?.trim();
  if (!apiKey) {
    // If Ably is not configured, inform the client to use the built-in SSE transport
    return NextResponse.json({
      provider: "sse",
      message: "Ably key not configured. Fallback to Server-Sent Events stream.",
    });
  }

  try {
    const rest = new Ably.Rest(apiKey);
    const tokenParams: any = {
      clientId: session.user._id.toString(),
      capability: JSON.stringify({
        "dashboard:operations": ["subscribe"],
      }),
      ttl: 3600000, // 1 hour
    };

    const tokenRequest = await rest.auth.createTokenRequest(tokenParams);
    return NextResponse.json({
      provider: "ably",
      tokenRequest,
    });
  } catch (err: any) {
    console.error("[Ably Token Request Error]", err?.message);
    return NextResponse.json({
      provider: "sse",
      error: "Failed to generate Ably token, fallback to SSE.",
    });
  }
}
