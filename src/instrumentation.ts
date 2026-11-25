/**
 * Next.js Server Startup Instrumentation
 * 
 * Executes once when the Next.js server boots up.
 * Evaluates the Node.js runtime and triggers MongoDB Atlas startup diagnostics.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { runStartupDiagnostics } = await import("@/lib/db/mongodb");
      // Execute asynchronously without blocking build or server readiness
      runStartupDiagnostics().catch((err) => {
        console.error("[DB ERROR] Unhandled rejection during MongoDB startup diagnostics:", err?.message || err);
      });
    } catch (e: any) {
      console.error("[DB ERROR] Failed to load MongoDB startup diagnostics:", e?.message || e);
    }
  }
}
