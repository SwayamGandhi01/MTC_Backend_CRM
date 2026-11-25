import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/roles";
import { connectToDatabase, getConnectionStatus, classifyMongoError } from "@/lib/db/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access database health status.",
          },
        },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    const mongooseInstance = await connectToDatabase({ silent: true });
    const db = mongooseInstance.connection.db;

    if (!db) {
      const status = getConnectionStatus();
      return NextResponse.json(
        {
          success: false,
          database: status.database,
          status: "disconnected",
          message: "Database instance is unavailable.",
        },
        { status: 503 }
      );
    }

    // Perform real admin ping
    await db.admin().ping();
    const latencyMs = Date.now() - startTime;
    const status = getConnectionStatus();

    return NextResponse.json({
      success: true,
      database: status.database,
      status: "connected",
      host: status.host,
      latencyMs,
      message: "MongoDB Atlas connection is healthy",
    });
  } catch (error: any) {
    const classified = classifyMongoError(error);
    const status = getConnectionStatus();

    return NextResponse.json(
      {
        success: false,
        database: status.database,
        status: "disconnected",
        message: classified.reason,
        code: classified.code,
      },
      { status: 503 }
    );
  }
}
