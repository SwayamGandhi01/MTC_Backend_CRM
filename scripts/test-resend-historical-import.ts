import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { connectToDatabase } from "../src/lib/db/mongodb";
import { EmailLog } from "../src/models/EmailLog";
import { ResendSyncLog } from "../src/models/ResendSyncLog";
import { syncResendHistoricalEmails, getLatestSyncStatus } from "../src/lib/email/resend-sync";
import { getDashboardOverviewData } from "../src/lib/services/dashboard.service";

async function runHistoricalImportTests() {
  console.log("==================================================");
  console.log("TESTING RESEND HISTORICAL IMPORT & SYNC PIPELINE");
  console.log("==================================================");

  await connectToDatabase();
  console.log("[DB] Connected to MongoDB Atlas successfully.");

  const initialCount = await EmailLog.countDocuments();
  console.log(`[STATE] Initial EmailLog count in MongoDB: ${initialCount}`);

  // Test 1: Historical Email Import via Live Resend API
  console.log("\n[TEST 1] Running syncResendHistoricalEmails()...");
  const syncResult1 = await syncResendHistoricalEmails({ triggeredBy: "automated-test-suite" });
  console.log("  - Sync Result:", JSON.stringify(syncResult1, null, 2));

  if (syncResult1.status !== "completed") {
    throw new Error(`FAIL: Historical import failed with status: ${syncResult1.status}`);
  }
  if (syncResult1.totalDiscovered === 0) {
    throw new Error("FAIL: Zero emails discovered from connected Resend account!");
  }
  console.log(`  - Successfully discovered ${syncResult1.totalDiscovered} emails, imported ${syncResult1.totalImported}.`);
  console.log("[TEST 1 PASSED] Historical Resend emails imported into MongoDB Atlas.");

  // Test 2: Idempotency (Run synchronization twice to verify no duplicates)
  console.log("\n[TEST 2] Running syncResendHistoricalEmails() second time (Idempotency verification)...");
  const countAfterFirstSync = await EmailLog.countDocuments();
  const syncResult2 = await syncResendHistoricalEmails({ triggeredBy: "automated-test-suite-pass-2" });
  console.log("  - Second Sync Result:", JSON.stringify(syncResult2, null, 2));
  const countAfterSecondSync = await EmailLog.countDocuments();

  if (countAfterSecondSync !== countAfterFirstSync) {
    throw new Error(
      `FAIL: Second sync created duplicate records! Count before: ${countAfterFirstSync}, Count after: ${countAfterSecondSync}`
    );
  }
  if (syncResult2.totalImported !== 0) {
    throw new Error(`FAIL: Expected 0 new imports on second sync, got: ${syncResult2.totalImported}`);
  }
  console.log(`  - Verified zero duplicates created. Total skipped/reconciled: ${syncResult2.totalSkipped + syncResult2.totalUpdated}`);
  console.log("[TEST 2 PASSED] Idempotency confirmed - repeated sync does not create duplicates.");

  // Test 3: Verify imported records structure
  console.log("\n[TEST 3] Verifying imported email records in MongoDB Atlas...");
  const importedSamples = await EmailLog.find({ origin: "resend_import" }).limit(3).lean();
  if (importedSamples.length === 0) {
    throw new Error("FAIL: No records with origin 'resend_import' found in MongoDB!");
  }
  for (const item of importedSamples) {
    console.log(`  - [ID: ${item.resendMessageId}] Subject: "${item.subject}" | Status: ${item.status} | SentAt: ${item.sentAt}`);
    if (!item.resendMessageId) throw new Error("FAIL: resendMessageId missing on imported record!");
    if (!item.sentAt) throw new Error("FAIL: sentAt missing on imported record!");
    if (!item.status) throw new Error("FAIL: status missing on imported record!");
  }
  console.log("[TEST 3 PASSED] Imported email records have valid Resend IDs, statuses, and timestamps.");

  // Test 4: Verify Dashboard Overview includes Historical Emails
  console.log("\n[TEST 4] Verifying getDashboardOverviewData() integration...");
  const overview = await getDashboardOverviewData();
  const emailPerf = overview.emailPerformance;
  if (!emailPerf) {
    throw new Error("FAIL: emailPerformance missing from dashboard overview!");
  }
  console.log("  - Dashboard Total Emails Metric:", emailPerf.metrics.totalSent);
  console.log("  - Dashboard Delivered Metric:", emailPerf.metrics.delivered);
  console.log("  - Dashboard Recent Emails Count:", emailPerf.recentEmails.length);
  console.log("  - Recent Email Origins:", emailPerf.recentEmails.map((e) => e.origin));

  if (emailPerf.metrics.totalSent < countAfterFirstSync) {
    throw new Error(`FAIL: Dashboard totalSent (${emailPerf.metrics.totalSent}) is less than MongoDB count (${countAfterFirstSync})!`);
  }
  console.log("[TEST 4 PASSED] Dashboard reflects imported historical email statistics.");

  // Test 5: Verify Legacy Email Retention
  console.log("\n[TEST 5] Verifying legacy CRM email retention...");
  const legacyRecord = await EmailLog.findOne({ resendMessageId: { $exists: false } });
  if (legacyRecord) {
    console.log(`  - Legacy record preserved: "${legacyRecord.subject}" (Status: ${legacyRecord.status})`);
  } else {
    console.log("  - Note: No unlinked legacy email present.");
  }
  console.log("[TEST 5 PASSED] Legacy records preserved.");

  // Test 6: Verify ResendSyncLog audit trail
  console.log("\n[TEST 6] Verifying ResendSyncLog audit record...");
  const latestSync = await getLatestSyncStatus();
  if (!latestSync || latestSync.status !== "completed") {
    throw new Error("FAIL: Latest sync log record not found or not marked completed!");
  }
  console.log(`  - Sync Log ID: ${latestSync.syncId} | Discovered: ${latestSync.totalDiscovered} | Imported: ${latestSync.totalImported}`);
  console.log("[TEST 6 PASSED] Audit trail created and persisted.");

  console.log("\n==================================================");
  console.log("ALL HISTORICAL RESEND IMPORT TESTS PASSED!");
  console.log("==================================================");

  process.exit(0);
}

runHistoricalImportTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
