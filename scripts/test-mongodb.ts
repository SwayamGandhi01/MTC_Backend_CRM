import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Safely load .env.local without exposing values or credentials
function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

async function runTest() {
  loadLocalEnv();

  const { connectToDatabase } = await import("../src/lib/db/mongodb");

  const startTime = Date.now();
  console.log("[Test Script] Initiating database connection verification...");

  try {
    const mongooseInstance = await connectToDatabase();
    const duration = Date.now() - startTime;

    const dbName = mongooseInstance.connection.name || process.env.MONGODB_DB_NAME || "mtc_crm";
    const db = mongooseInstance.connection.db;

    if (!db) {
      throw new Error("Mongoose connection established but database instance is unavailable.");
    }

    // Run ping command
    const pingResult = await db.admin().ping();

    console.log("[Test Script] Ping result:", JSON.stringify(pingResult));
    console.log(`[Test Script] Database Name: ${dbName}`);
    console.log(`[Test Script] Connection Latency: ${duration}ms`);
    console.log("[Test Script] MongoDB Atlas connection test PASSED.");

    // Clean disconnect
    await mongoose.disconnect();
    console.log("[Test Script] Connection closed cleanly.");
    process.exit(0);
  } catch (error: any) {
    console.error("[Test Script] Database connection test FAILED.");
    console.error(`[Test Script] Error: ${error.message || "Unknown error"}`);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

runTest();
