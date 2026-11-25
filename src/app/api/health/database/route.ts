import { NextResponse } from "next/server";
import { connectToDatabase, getConnectionStatus, classifyMongoError } from "@/lib/db/mongodb";

export const dynamic = "force-dynamic";

/**
 * GET /api/health/database
 * 
 * Health check endpoint reporting MongoDB connection status,
 * connection pool state, server latency, and classified diagnostics.
 * Never leaks database credentials or secret connection tokens.
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const startTime = Date.now();
    const mongooseInstance = await connectToDatabase({ silent: true });
    const db = mongooseInstance.connection.db;

    if (!db) {
      const status = getConnectionStatus();
      return NextResponse.json(
        {
          status: "disconnected",
          database: status.database,
          connectionState: status.state,
          timestamp,
          error: {
            code: "MONGO_DB_UNAVAILABLE",
            message: "Mongoose connection is open but database instance is unavailable.",
          },
        },
        { status: 503 }
      );
    }

    // Ping the active admin database to measure real-time latency
    await db.admin().ping();
    const latencyMs = Date.now() - startTime;
    const status = getConnectionStatus();

    return NextResponse.json(
      {
        status: "connected",
        database: status.database,
        connectionState: status.state,
        latencyMs,
        host: status.host,
        timestamp,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const classified = classifyMongoError(error);
    const status = getConnectionStatus();

    return NextResponse.json(
      {
        status: "disconnected",
        database: status.database,
        connectionState: status.state,
        timestamp,
        error: {
          code: classified.code,
          message: classified.reason,
          possibleCause: classified.possibleCause,
          suggestedChecks: classified.suggestedChecks,
        },
      },
      { status: 503 }
    );
  }
}
