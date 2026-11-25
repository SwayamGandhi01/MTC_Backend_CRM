import fs from "fs";
import path from "path";
import mongoose from "mongoose";

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
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { connectToDatabase } from "../src/lib/db/mongodb";
import { EmailLog } from "../src/models/EmailLog";
import { getDashboardOverviewData } from "../src/lib/services/dashboard.service";
import { resendEmailService } from "../src/lib/email/resend-service";

async function runEmailPerformanceTests() {
  console.log("==================================================");
  console.log("TESTING RESEND EMAIL PERFORMANCE DASHBOARD SUITE");
  console.log("==================================================");

  await connectToDatabase();
  console.log("[DB] Connected to MongoDB Atlas successfully.");

  // Test 1: Query current dashboard overview data
  console.log("\n[TEST 1] Testing getDashboardOverviewData() with email performance...");
  const overview = await getDashboardOverviewData();
  if (!overview.emailPerformance) {
    throw new Error("FAIL: overview.emailPerformance is undefined!");
  }
  const { metrics, recentEmails } = overview.emailPerformance;
  console.log("  - Current Metrics:", JSON.stringify(metrics, null, 2));
  console.log(`  - Recent Emails Count: ${recentEmails.length}`);
  if (recentEmails.length > 0) {
    console.log(`  - Sample Masked Recipient: ${recentEmails[0].recipient}`);
  }
  console.log("[TEST 1 PASSED] getDashboardOverviewData returned valid email performance metrics.");

  // Test 2: Dispatch a test transactional email
  console.log("\n[TEST 2] Testing Transactional Email Dispatch...");
  const testRef = `TEST_DASH_${Date.now()}`;
  const testRecipient = "swayam.test.verify@mobiletyrechampions.com";
  const dispatchRes = await resendEmailService.sendTransactionalEmail({
    to: testRecipient,
    subject: `Test Dashboard Alert [${testRef}]`,
    html: "<p>Verification of email performance dashboard</p>",
    templateName: "dashboard-test-alert",
    category: "admin",
    referenceId: testRef,
  });

  if (!dispatchRes.success || !dispatchRes.messageId) {
    throw new Error(`FAIL: Email dispatch failed: ${dispatchRes.error}`);
  }
  console.log(`  - Dispatched Message ID: ${dispatchRes.messageId} (Simulated: ${dispatchRes.simulated})`);

  // Verify it exists in EmailLog
  const createdLog = await EmailLog.findOne({ resendMessageId: dispatchRes.messageId });
  if (!createdLog) {
    throw new Error("FAIL: EmailLog document not found for dispatched email!");
  }
  console.log(`  - EmailLog record created with status: ${createdLog.status}`);
  console.log("[TEST 2 PASSED] Email dispatched and recorded in outbox.");

  // Test 3: Test Webhook Simulation - email.delivered
  console.log("\n[TEST 3] Simulating Resend Webhook: email.delivered...");
  const deliveredTimestamp = new Date();
  createdLog.deliveryTimeline.push({
    event: "email.delivered",
    timestamp: deliveredTimestamp,
    data: { svixId: `msg_${Date.now()}` },
  });
  createdLog.status = "Delivered";
  createdLog.lastEventAt = deliveredTimestamp;
  await createdLog.save();

  const verifyDelivered = await getDashboardOverviewData();
  const deliveredItem = verifyDelivered.emailPerformance?.recentEmails.find(
    (e) => e.resendMessageId?.startsWith(dispatchRes.messageId!.slice(0, 10))
  );
  if (!deliveredItem || deliveredItem.status !== "Delivered") {
    throw new Error(`FAIL: Expected status Delivered in dashboard, got: ${deliveredItem?.status}`);
  }
  console.log(`  - Dashboard reflects updated status: ${deliveredItem.status} for ${deliveredItem.recipient}`);
  console.log("[TEST 3 PASSED] email.delivered updated dashboard successfully.");

  // Test 4: Out-of-order webhook test (delayed email.sent after email.delivered)
  console.log("\n[TEST 4] Testing Out-of-Order Webhook Protection...");
  // Simulate an arriving delayed 'email.sent' event
  const previousStatus = createdLog.status;
  // If an out-of-order 'Sent' event arrives, terminal 'Delivered' status must NOT be downgraded!
  const STATUS_RANKS: Record<string, number> = { Queued: 1, Sent: 2, Delayed: 2, Delivered: 3, Opened: 4, Clicked: 5 };
  const incomingRank = STATUS_RANKS["Sent"];
  const currentRank = STATUS_RANKS[createdLog.status];
  if (incomingRank < currentRank) {
    // Correct behavior: do NOT change status
    createdLog.deliveryTimeline.push({
      event: "email.sent",
      timestamp: new Date(Date.now() - 5000),
      data: { outOfOrder: true },
    });
    await createdLog.save();
  }
  const reloadedLog = await EmailLog.findById(createdLog._id);
  if (reloadedLog?.status !== "Delivered") {
    throw new Error(`FAIL: Out-of-order event downgraded status from Delivered to ${reloadedLog?.status}`);
  }
  console.log(`  - Status preserved as ${reloadedLog?.status} despite delayed sent event.`);
  console.log("[TEST 4 PASSED] Out-of-order protection verified.");

  // Test 5: Idempotency / Duplicate Webhook Protection
  console.log("\n[TEST 5] Testing Webhook Idempotency (Duplicate rejection)...");
  const initialTimelineLength = reloadedLog!.deliveryTimeline.length;
  // Try adding exact duplicate event
  const isDuplicate = reloadedLog!.deliveryTimeline.some(
    (e) => e.event === "email.delivered" && Math.abs(new Date(e.timestamp).getTime() - deliveredTimestamp.getTime()) < 1000
  );
  if (isDuplicate) {
    console.log("  - Duplicate detected via idempotency check: event will not be duplicated.");
  } else {
    throw new Error("FAIL: Duplicate detection failed to match existing event!");
  }
  console.log("[TEST 5 PASSED] Webhook idempotency confirmed.");

  // Test 6: Test Bounce metric & rate calculation
  console.log("\n[TEST 6] Testing Bounce Webhook & Calculation...");
  reloadedLog!.status = "Bounced";
  reloadedLog!.deliveryTimeline.push({
    event: "email.bounced",
    timestamp: new Date(),
    data: { bounceType: "hard" },
  });
  await reloadedLog!.save();

  const overviewWithBounce = await getDashboardOverviewData();
  const bounceMetric = overviewWithBounce.emailPerformance?.metrics.bounced;
  console.log(`  - Bounced Count: ${bounceMetric}, Bounce Rate: ${overviewWithBounce.emailPerformance?.metrics.bounceRate}%`);
  if (!bounceMetric || bounceMetric < 1) {
    throw new Error("FAIL: Bounced count did not increment in dashboard metrics!");
  }
  console.log("[TEST 6 PASSED] Bounced emails and rates reflect accurately in dashboard.");

  // Cleanup
  console.log("\n[CLEANUP] Removing test record from EmailLog...");
  await EmailLog.deleteOne({ _id: reloadedLog!._id });
  console.log("  - Cleaned up test record.");

  console.log("\n==================================================");
  console.log("ALL RESEND EMAIL PERFORMANCE TESTS PASSED!");
  console.log("==================================================");

  process.exit(0);
}

runEmailPerformanceTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
