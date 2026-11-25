import mongoose from "mongoose";

/**
 * Enhanced MongoDB Atlas Connection & Diagnostic Manager for Mobile Tyre Champions CRM.
 * 
 * Features:
 * 1. Global singleton caching across Next.js hot module reloading and Vercel serverless invocations.
 * 2. Detailed exception classification (MongoServerSelectionError, Auth failures, timeouts, DNS, IP restrictions).
 * 3. Sanitized host logging (never reveals credentials, passwords, or full connection URIs).
 * 4. Mongoose lifecycle events registered once per process ([DB], [DB SUCCESS], [DB WARNING], [DB ERROR]).
 * 5. Startup diagnostic banner reporting live connection health.
 * 6. Completely independent of Strapi or legacy backends.
 */

export interface ClassifiedMongoError {
  code: string;
  errorType: string;
  reason: string;
  possibleCause: string;
  suggestedChecks: string[];
  rawMessage: string;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  hasLoggedBanner: boolean;
  eventsRegistered: boolean;
  lastError: ClassifiedMongoError | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
  // eslint-disable-next-line no-var
  var hasRunMongoStartupDiagnostics: boolean | undefined;
}

function getCache(): MongooseCache {
  if (!global.mongooseCache) {
    global.mongooseCache = {
      conn: null,
      promise: null,
      hasLoggedBanner: false,
      eventsRegistered: false,
      lastError: null,
    };
  }
  return global.mongooseCache;
}

/**
 * Resets the active singleton connection cache (useful in test suites or reconnection routines).
 */
export function resetConnectionCache(): void {
  const cache = getCache();
  cache.conn = null;
  cache.promise = null;
  cache.lastError = null;
  cache.hasLoggedBanner = false;
}

/**
 * Safely extracts host/cluster information from a MongoDB URI without exposing credentials.
 * e.g., "mongodb+srv://user:pass@cluster0.abcde.mongodb.net/..." -> "cluster0.abcde.mongodb.net"
 */
export function extractSanitizedHost(uri?: string): string {
  if (!uri) return "unconfigured-host";
  try {
    const atIdx = uri.indexOf("@");
    if (atIdx !== -1) {
      const afterAt = uri.slice(atIdx + 1);
      const endMatch = afterAt.search(/[\/\?]/);
      return endMatch !== -1 ? afterAt.slice(0, endMatch) : afterAt;
    }
    // Direct host (e.g. localhost:27017)
    const protocolMatch = uri.match(/^mongodb(?:\+srv)?:\/\//);
    if (protocolMatch) {
      const withoutProto = uri.slice(protocolMatch[0].length);
      const endMatch = withoutProto.search(/[\/\?]/);
      return endMatch !== -1 ? withoutProto.slice(0, endMatch) : withoutProto;
    }
    return "cluster-host";
  } catch {
    return "cluster-host";
  }
}

/**
 * Categorizes raw MongoDB / Mongoose exceptions into actionable diagnostic objects.
 */
export function classifyMongoError(err: any): ClassifiedMongoError {
  if (err?.classified) {
    return err.classified;
  }

  const errorType = err?.name || "MongoConnectionError";
  const rawMessage = err?.message || String(err);
  const msgLower = rawMessage.toLowerCase();

  // Already classified code in message
  if (msgLower.includes("mongo_missing_uri") || msgLower.includes("missing required environment variable: mongodb_uri")) {
    return {
      code: "MONGO_MISSING_URI",
      errorType: "MissingEnvironmentVariable",
      reason: "MONGODB_URI environment variable is missing or empty.",
      possibleCause: "The .env.local file does not contain a MONGODB_URI definition.",
      suggestedChecks: [
        "Check that .env.local exists in the project root.",
        "Ensure MONGODB_URI=mongodb+srv://... is configured without spaces.",
      ],
      rawMessage,
    };
  }

  // 1. IP Access List / Server Selection Timeout
  if (
    errorType === "MongoServerSelectionError" ||
    msgLower.includes("server selection timed out") ||
    msgLower.includes("no primary found") ||
    msgLower.includes("connect econnrefused") ||
    msgLower.includes("mongo_server_selection_failed")
  ) {
    const isEconnRefused = msgLower.includes("econnrefused");
    return {
      code: isEconnRefused ? "MONGO_CONNECTION_REFUSED" : "MONGO_SERVER_SELECTION_FAILED",
      errorType: isEconnRefused ? "ECONNREFUSED" : "MongoServerSelectionError",
      reason: isEconnRefused
        ? "Connection refused by destination host or port."
        : "Server selection timed out.",
      possibleCause: isEconnRefused
        ? "MongoDB daemon is not running on target host/port, or network firewall is rejecting packets."
        : "MongoDB Atlas IP Access List may not allow this server's IP address, or cluster is unreachable.",
      suggestedChecks: [
        "Verify MONGODB_URI in .env.local.",
        "Verify MongoDB username and password.",
        "Check MongoDB Atlas Network Access (ensure your current IP is whitelisted, or allow 0.0.0.0/0).",
        "Check whether the Atlas cluster is active (not paused).",
        "Verify local internet connectivity.",
      ],
      rawMessage,
    };
  }

  // 2. Authentication failure / Bad credentials
  if (
    errorType === "MongoSecurityError" ||
    msgLower.includes("authentication failed") ||
    msgLower.includes("auth failed") ||
    msgLower.includes("mongo_authentication_failed") ||
    err?.code === 8000
  ) {
    return {
      code: "MONGO_AUTHENTICATION_FAILED",
      errorType: "MongoSecurityError",
      reason: "Database authentication failed.",
      possibleCause: "Database username/password in MONGODB_URI is incorrect or has expired.",
      suggestedChecks: [
        "Verify database username and password in MONGODB_URI.",
        "Ensure special characters in password are properly URL-encoded (e.g., %23 for #).",
        "Check Database Users tab in MongoDB Atlas to verify user exists and permissions are granted.",
      ],
      rawMessage,
    };
  }

  // 3. DNS Lookup Failure
  if (msgLower.includes("enotfound") || msgLower.includes("querysrv enotfound") || msgLower.includes("mongo_dns_resolution_failed")) {
    return {
      code: "MONGO_DNS_RESOLUTION_FAILED",
      errorType: "ENOTFOUND",
      reason: "MongoDB hostname/DNS could not be resolved.",
      possibleCause: "Cluster domain name does not exist or local DNS server failed to resolve Atlas SRV record.",
      suggestedChecks: [
        "Verify the cluster hostname in MONGODB_URI.",
        "Check local internet connection and DNS settings (try public DNS 8.8.8.8 or 1.1.1.1).",
        "Check if network proxy / VPN is interfering with SRV lookups.",
      ],
      rawMessage,
    };
  }

  // 4. Socket Timeout
  if (msgLower.includes("etimedout") || msgLower.includes("mongo_socket_timeout")) {
    return {
      code: "MONGO_SOCKET_TIMEOUT",
      errorType: "ETIMEDOUT",
      reason: "Network socket connection timed out.",
      possibleCause: "High network latency, packet loss, or firewall dropped connection to Atlas.",
      suggestedChecks: [
        "Check internet connection stability.",
        "Check MongoDB Atlas cloud provider health status.",
        "Inspect firewall rules on local network.",
      ],
      rawMessage,
    };
  }

  // 5. Malformed Connection String
  if (
    errorType === "MongoParseError" ||
    msgLower.includes("invalid scheme") ||
    msgLower.includes("must begin with mongodb") ||
    msgLower.includes("uri malformed") ||
    msgLower.includes("mongo_invalid_connection_string")
  ) {
    return {
      code: "MONGO_INVALID_CONNECTION_STRING",
      errorType: "MongoParseError",
      reason: "MONGODB_URI format is invalid.",
      possibleCause: "Malformed connection string or missing mongodb:// / mongodb+srv:// protocol prefix.",
      suggestedChecks: [
        "Verify MONGODB_URI starts with 'mongodb+srv://' or 'mongodb://'.",
        "Check for accidental spaces, trailing quotes, or unescaped characters in .env.local.",
      ],
      rawMessage,
    };
  }

  // 6. Generic Fallback
  return {
    code: "MONGO_GENERIC_CONNECTION_ERROR",
    errorType,
    reason: "MongoDB connection could not be established.",
    possibleCause: "Underlying network transport error or cluster configuration issue.",
    suggestedChecks: [
      "Verify MONGODB_URI and MONGODB_DB_NAME in .env.local.",
      "Check MongoDB Atlas cluster status and network firewall settings.",
      "Review Atlas deployment logs in the Atlas web console.",
    ],
    rawMessage,
  };
}

/**
 * Registers Mongoose connection event listeners once per process lifecycle.
 */
function registerMongooseListeners(host: string, dbName: string) {
  const cache = getCache();
  if (cache.eventsRegistered) return;
  cache.eventsRegistered = true;

  mongoose.connection.on("connecting", () => {
    console.log(`[DB] Connecting to MongoDB Atlas cluster (${host})...`);
  });

  mongoose.connection.on("connected", () => {
    console.log(`[DB SUCCESS] MongoDB connection established (db: ${dbName}).`);
  });

  mongoose.connection.on("open", () => {
    console.log(`[DB SUCCESS] MongoDB connection stream open and ready for queries.`);
  });

  mongoose.connection.on("disconnecting", () => {
    console.log(`[DB] Disconnecting from MongoDB cluster (${host})...`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn(`[DB WARNING] MongoDB disconnected from cluster (${host}).`);
    const c = getCache();
    c.conn = null;
    c.promise = null;
  });

  mongoose.connection.on("reconnected", () => {
    console.log(`[DB SUCCESS] MongoDB reconnected successfully to (${host}).`);
  });

  mongoose.connection.on("error", (err: any) => {
    const classified = classifyMongoError(err);
    getCache().lastError = classified;
    console.error(`[DB ERROR] Connection error [${classified.code}]: ${classified.reason}`);
  });
}

/**
 * Prints the formatted startup diagnostic banner on success.
 */
function printSuccessBanner(dbName: string, host: string) {
  const nodeEnv = process.env.NODE_ENV || "development";
  console.log("\n==================================================");
  console.log("MTC CRM - DATABASE STATUS");
  console.log("==================================================");
  console.log("[INFO] Application starting...");
  console.log(`[INFO] Environment: ${nodeEnv}`);
  console.log("[INFO] Connecting to MongoDB Atlas...");
  console.log("[SUCCESS] MongoDB connected successfully.");
  console.log(`[INFO] Database: ${dbName}`);
  console.log(`[INFO] Host: ${host}`);
  console.log("[INFO] Ready to accept application requests.");
  console.log("==================================================\n");
}

/**
 * Prints the formatted startup diagnostic banner on failure with actionable suggestions.
 */
function printFailureBanner(classified: ClassifiedMongoError) {
  const nodeEnv = process.env.NODE_ENV || "development";
  console.error("\n==================================================");
  console.error("MTC CRM - DATABASE CONNECTION FAILED");
  console.error("==================================================");
  console.error("[INFO] Application starting...");
  console.error(`[INFO] Environment: ${nodeEnv}`);
  console.error("[INFO] Connecting to MongoDB Atlas...");
  console.error(`[ERROR] MongoDB connection failed.`);
  console.error(`[ERROR CODE] ${classified.code}`);
  console.error(`[ERROR TYPE] ${classified.errorType}`);
  console.error(`[REASON] ${classified.reason}`);
  console.error(`[POSSIBLE CAUSE] ${classified.possibleCause}`);
  console.error("[ACTIONABLE CHECKS]");
  classified.suggestedChecks.forEach((check, idx) => {
    console.error(`  ${idx + 1}. ${check}`);
  });
  console.error("==================================================\n");
}

/**
 * Prints missing environment variable warning banner.
 */
function printMissingEnvBanner(varName: string) {
  console.error("\n==================================================");
  console.error("MTC CRM - CONFIGURATION ERROR");
  console.error("==================================================");
  console.error(`[ERROR] Missing required environment variable: ${varName}`);
  console.error("[POSSIBLE CAUSE] .env.local file missing or not loaded.");
  console.error("[ACTIONABLE CHECKS]");
  console.error(`  1. Ensure .env.local exists in the project root directory.`);
  console.error(`  2. Add '${varName}=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>'`);
  console.error(`  3. Restart Next.js dev server.`);
  console.error("==================================================\n");
}

/**
 * Connect to MongoDB Atlas with singleton caching, lifecycle monitoring, and error diagnostics.
 */
export async function connectToDatabase(options?: { silent?: boolean }): Promise<typeof mongoose> {
  const cache = getCache();

  // 1. If connection is already open and ready, return cached connection
  if (cache.conn && cache.conn.connection && cache.conn.connection.readyState === 1) {
    return cache.conn;
  }

  // If connection is closed or broken, reset stale promise and connection
  if (cache.conn && cache.conn.connection && cache.conn.connection.readyState === 0) {
    cache.promise = null;
    cache.conn = null;
  }

  // 2. If a connection attempt is currently in flight, await that same promise
  if (!cache.promise) {
    const uri = process.env.MONGODB_URI?.trim();
    const dbName = process.env.MONGODB_DB_NAME?.trim() || "mtc_crm";

    if (!uri) {
      if (!options?.silent) {
        printMissingEnvBanner("MONGODB_URI");
      }
      const errObj: ClassifiedMongoError = {
        code: "MONGO_MISSING_URI",
        errorType: "MissingEnvironmentVariable",
        reason: "MONGODB_URI environment variable is missing or empty.",
        possibleCause: "The .env.local file does not contain a MONGODB_URI definition.",
        suggestedChecks: [
          "Check that .env.local exists in the project root.",
          "Ensure MONGODB_URI=mongodb+srv://... is configured without spaces.",
        ],
        rawMessage: "MONGODB_URI is not set",
      };
      cache.lastError = errObj;
      const customErr: any = new Error(`[MongoDB] Missing required environment variable: MONGODB_URI`);
      customErr.code = "MONGO_MISSING_URI";
      customErr.classified = errObj;
      throw customErr;
    }

    const host = extractSanitizedHost(uri);
    registerMongooseListeners(host, dbName);

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      dbName: dbName,
    };

    cache.promise = mongoose
      .connect(uri, opts)
      .then(async (mongooseInstance) => {
        // Verify active database connectivity via admin ping
        const adminDb = mongooseInstance.connection.db?.admin();
        if (adminDb) {
          await adminDb.ping();
        }

        cache.lastError = null;

        if (!cache.hasLoggedBanner && !options?.silent) {
          printSuccessBanner(dbName, host);
          cache.hasLoggedBanner = true;
        }

        return mongooseInstance;
      })
      .catch((err) => {
        cache.promise = null;
        cache.conn = null;
        const classified = classifyMongoError(err);
        cache.lastError = classified;

        if (!options?.silent) {
          printFailureBanner(classified);
        }

        const customErr: any = new Error(`[MongoDB] ${classified.reason} (${classified.code})`);
        customErr.code = classified.code;
        customErr.classified = classified;
        throw customErr;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null;
    cache.conn = null;
    throw e;
  }

  return cache.conn;
}

/**
 * Returns current connection state without re-triggering a connection.
 */
export function getConnectionStatus(): {
  connected: boolean;
  state: number;
  database: string;
  host: string;
  lastError: ClassifiedMongoError | null;
} {
  const cache = getCache();
  const state = mongoose.connection.readyState;
  const uri = process.env.MONGODB_URI;
  const dbName = mongoose.connection.name || process.env.MONGODB_DB_NAME || "mtc_crm";
  const host = extractSanitizedHost(uri);

  return {
    connected: state === 1,
    state,
    database: dbName,
    host,
    lastError: cache.lastError,
  };
}

/**
 * Startup diagnostic routine executed during server boot.
 * Non-blocking, safe across environments.
 */
export async function runStartupDiagnostics(): Promise<boolean> {
  if (global.hasRunMongoStartupDiagnostics) {
    return true;
  }
  global.hasRunMongoStartupDiagnostics = true;

  try {
    await connectToDatabase();
    return true;
  } catch (err: any) {
    // Error is already formatted and printed by connectToDatabase
    return false;
  }
}

export default connectToDatabase;
