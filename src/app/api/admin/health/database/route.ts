import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/db/mongodb";

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

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        {
          success: false,
          database: process.env.MONGODB_DB_NAME || "mtc_crm",
          status: "disconnected",
          message: "Database instance is unavailable.",
        },
        { status: 503 }
      );
    }

    // Perform real admin ping
    await db.admin().ping();

    const dbName = mongoose.connection.name || process.env.MONGODB_DB_NAME || "mtc_crm";

    return NextResponse.json({
      success: true,
      database: dbName,
      status: "connected",
      message: "MongoDB Atlas connection is healthy",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        database: process.env.MONGODB_DB_NAME || "mtc_crm",
        status: "disconnected",
        message: "MongoDB Atlas connection is unavailable.",
      },
      { status: 503 }
    );
  }
}
