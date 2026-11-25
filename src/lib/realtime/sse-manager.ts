/**
 * Server-Sent Events (SSE) Manager for Next.js App Router
 * 
 * Provides instantaneous real-time pub/sub across browser sessions.
 * Acts as the zero-configuration real-time transport and fallback
 * when an external managed Ably cluster is not yet provisioned.
 */

type ClientCallback = (data: string) => void;

interface SseClient {
  id: string;
  userId: string;
  send: ClientCallback;
  connectedAt: Date;
}

declare global {
  // eslint-disable-next-line no-var
  var sseClients: Map<string, SseClient> | undefined;
}

const clients: Map<string, SseClient> = global.sseClients || new Map();
if (!global.sseClients) {
  global.sseClients = clients;
}

export const sseManager = {
  addClient(id: string, userId: string, send: ClientCallback) {
    clients.set(id, { id, userId, send, connectedAt: new Date() });
  },

  removeClient(id: string) {
    clients.delete(id);
  },

  getClientCount(): number {
    return clients.size;
  },

  broadcast(event: { type: string; payload: any }) {
    const message = `event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`;
    for (const [id, client] of clients.entries()) {
      try {
        client.send(message);
      } catch (err) {
        console.warn(`[SSE] Failed to deliver to client ${id}, removing.`);
        clients.delete(id);
      }
    }
  },
};
