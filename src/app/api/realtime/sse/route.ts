import { NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { sseManager } from "@/lib/realtime/sse-manager";

export const dynamic = "force-dynamic";

/**
 * GET /api/realtime/sse
 * 
 * Server-Sent Events (SSE) stream for authenticated CRM dashboard clients.
 * Streams real-time operational notifications with zero third-party dependencies.
 */
export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial handshake
      const initialMessage = `event: connected\ndata: ${JSON.stringify({
        clientId,
        status: "connected",
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialMessage));

      const send = (message: string) => {
        if (!isClosed) {
          try {
            controller.enqueue(new TextEncoder().encode(message));
          } catch {
            isClosed = true;
            sseManager.removeClient(clientId);
          }
        }
      };

      sseManager.addClient(clientId, session.user._id.toString(), send);

      // Keepalive heartbeat every 25 seconds
      const heartbeat = setInterval(() => {
        if (isClosed) {
          clearInterval(heartbeat);
          return;
        }
        try {
          controller.enqueue(new TextEncoder().encode(`: heartbeat\n\n`));
        } catch {
          isClosed = true;
          clearInterval(heartbeat);
          sseManager.removeClient(clientId);
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        clearInterval(heartbeat);
        sseManager.removeClient(clientId);
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
    cancel() {
      isClosed = true;
      sseManager.removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
