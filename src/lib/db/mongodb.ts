import mongoose from "mongoose";

/**
 * MongoDB Atlas Connection Manager using Mongoose.
 * 
 * Implements a cached singleton connection pattern across Next.js
 * hot module reloads in development and serverless invocations.
 * 
 * Features:
 * 1. Connects directly to MongoDB Atlas using MONGODB_URI and MONGODB_DB_NAME.
 * 2. Caches the active connection and active connection promise to prevent multiple concurrent attempts.
 * 3. Never logs or prints connection strings, credentials, or secrets.
 * 4. Displays verified connection banner upon successful connection or clear diagnostic failure message.
 * 5. Completely independent of Strapi or legacy backends.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  hasLoggedBanner?: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
  hasLoggedBanner: false,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

function printSuccessBanner(dbName: string) {
  console.log(`
==================================================
 MOBILE TYRE CHAMPIONS CRM
 DATABASE CONNECTION STATUS
==================================================

[MongoDB] Connecting to MongoDB Atlas...
[MongoDB] Connection successful!
[MongoDB] Database: ${dbName}
[MongoDB] Connection state: CONNECTED
[MongoDB] Ready to accept database operations.

==================================================
`);
}

function printFailureBanner() {
  console.error(`
[MongoDB] Connection failed!
[MongoDB] Check your MONGODB_URI, database user,
network access configuration, and Atlas availability.
`);
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  // 1. If connection is already open and ready, return cached connection
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  // 2. If a connection attempt is currently in flight, await that same promise
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI?.trim();
    const dbName = process.env.MONGODB_DB_NAME?.trim() || "mtc_crm";

    if (!uri) {
      printFailureBanner();
      throw new Error(
        "[MongoDB] MONGODB_URI environment variable is missing or empty. Please check .env.local."
      );
    }

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      dbName: dbName,
    };

    console.log("[MongoDB] Connecting to MongoDB Atlas...");

    cached.promise = mongoose
      .connect(uri, opts)
      .then(async (mongooseInstance) => {
        // Verify connection with admin ping
        const adminDb = mongooseInstance.connection.db?.admin();
        if (adminDb) {
          await adminDb.ping();
        }

        if (!cached.hasLoggedBanner) {
          printSuccessBanner(dbName);
          cached.hasLoggedBanner = true;
        }

        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        printFailureBanner();
        // Do not expose credentials or URI in the re-thrown error message
        throw new Error(
          `[MongoDB] Connection failed: ${err.name || "DatabaseError"}. Please verify Atlas network access and credentials.`
        );
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
