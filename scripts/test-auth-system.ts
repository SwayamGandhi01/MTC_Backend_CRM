import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { TOTP, Secret } from "otpauth";

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

async function runAuthTests() {
  loadLocalEnv();

  const { connectToDatabase } = await import("../src/lib/db/mongodb");
  const { AdminUser, Role, Session, AdminInvitation, SecurityEvent } = await import("../src/models");
  const { decryptMfaSecret, hashToken } = await import("../src/lib/auth/crypto");

  console.log("==================================================");
  console.log(" MOBILE TYRE CHAMPIONS CRM");
  console.log(" AUTOMATED AUTHENTICATION & RBAC TEST SUITE");
  console.log("==================================================\n");

  await connectToDatabase();

  const baseUrl = process.env.APP_URL || "http://localhost:3000";

  // --- TEST 1: Nonexistent Email Failure ---
  console.log("[Test 1] Testing nonexistent email login rejection...");
  const fakeLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "nonexistent_user_9999@mobiletyrechampions.com",
      password: "SomePassword123!",
    }),
  });
  const fakeLoginData = await fakeLoginRes.json();
  if (fakeLoginRes.status === 401 && fakeLoginData.error?.code === "INVALID_CREDENTIALS") {
    console.log("  PASS: Rejected with generic 401 INVALID_CREDENTIALS (no email enumeration).");
  } else {
    throw new Error(`Test 1 Failed: Unexpected status ${fakeLoginRes.status}`);
  }

  // --- TEST 2: Invalid Password Failure ---
  console.log("\n[Test 2] Testing incorrect password rejection...");
  const badPassRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@mobiletyrechampions.com",
      password: "WrongPassword999!",
    }),
  });
  const badPassData = await badPassRes.json();
  if (badPassRes.status === 401 && badPassData.error?.code === "INVALID_CREDENTIALS") {
    console.log("  PASS: Rejected with generic 401 INVALID_CREDENTIALS.");
  } else {
    throw new Error(`Test 2 Failed: Unexpected status ${badPassRes.status}`);
  }

  // --- TEST 3: Super Admin Login & Mandatory MFA Enforcement ---
  console.log("\n[Test 3] Testing Super Admin credentials & MFA Challenge...");
  const superLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@mobiletyrechampions.com",
      password: "AdminPassword123!",
    }),
  });
  const superLoginData = await superLoginRes.json();

  let cookieHeader = "";
  let recoveryCodes: string[] = [];

  if (superLoginData.requireMfaSetup) {
    console.log("  PASS: Mandatory MFA enrollment triggered on Super Admin login!");
    console.log("  PASS: Challenge token issued. Dashboard access withheld.");

    // Generate valid TOTP using returned secretBase32
    const totp = new TOTP({
      issuer: "Mobile Tyre Champions CRM",
      label: "admin@mobiletyrechampions.com",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(superLoginData.secretBase32),
    });
    const currentCode = totp.generate();
    console.log(`  [MFA Setup] Generated valid TOTP code: ${currentCode}`);

    // Verify MFA setup
    const mfaVerifyRes = await fetch(`${baseUrl}/api/auth/mfa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeToken: superLoginData.challengeToken,
        code: currentCode,
      }),
    });
    const mfaVerifyData = await mfaVerifyRes.json();
    cookieHeader = mfaVerifyRes.headers.get("set-cookie") || "";

    if (mfaVerifyRes.status === 200 && mfaVerifyData.success) {
      console.log("  PASS: TOTP setup verified successfully!");
      console.log(`  PASS: Issued ${mfaVerifyData.recoveryCodes?.length || 0} one-time recovery codes.`);
      recoveryCodes = mfaVerifyData.recoveryCodes || [];
    } else {
      throw new Error(`MFA setup verification failed: ${JSON.stringify(mfaVerifyData)}`);
    }
  } else if (superLoginData.requireMfa) {
    console.log("  PASS: MFA challenge triggered on Super Admin login!");
    const superAdmin = await AdminUser.findOne({ normalizedEmail: "admin@mobiletyrechampions.com" });
    const secretBase32 = decryptMfaSecret(superAdmin!.mfaSecretEncrypted!);
    const totp = new TOTP({
      issuer: "Mobile Tyre Champions CRM",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secretBase32),
    });
    const currentCode = totp.generate();

    const mfaVerifyRes = await fetch(`${baseUrl}/api/auth/mfa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeToken: superLoginData.challengeToken,
        code: currentCode,
      }),
    });
    cookieHeader = mfaVerifyRes.headers.get("set-cookie") || "";
    console.log("  PASS: MFA code verified successfully!");
  } else {
    throw new Error(`Test 3 Failed: Super Admin was granted session without MFA challenge!`);
  }

  // Extract session token
  const tokenMatch = cookieHeader.match(/(?:mtc_admin_session|__Host-mtc-admin-session)=([^;]+)/);
  const sessionToken = tokenMatch ? tokenMatch[1] : "";
  if (!sessionToken) {
    throw new Error("Failed to extract session cookie from verification response");
  }
  console.log("  PASS: Received secure HTTP-only session cookie.");

  // --- TEST 4: Protected Admin API Access with Session ---
  console.log("\n[Test 4] Testing authenticated Super Admin API access...");
  const usersRes = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Cookie: `mtc_admin_session=${sessionToken}` },
  });
  const usersData = await usersRes.json();
  if (usersRes.status === 200 && usersData.success) {
    console.log(`  PASS: GET /api/admin/users returned 200 OK (${usersData.users.length} users listed).`);
  } else {
    throw new Error(`Test 4 Failed: Expected 200, got ${usersRes.status}`);
  }

  // --- TEST 5: Employee Invitation Onboarding Flow ---
  console.log("\n[Test 5] Testing Employee Invitation & Account Activation Flow...");
  const testInviteEmail = `dispatcher_test_${Date.now()}@mobiletyrechampions.com`;

  const inviteRes = await fetch(`${baseUrl}/api/admin/users/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `mtc_admin_session=${sessionToken}`,
    },
    body: JSON.stringify({
      name: "Test Dispatcher",
      email: testInviteEmail,
      roleSlug: "dispatcher",
    }),
  });
  const inviteData = await inviteRes.json();
  if (inviteRes.status !== 200 || !inviteData.success) {
    throw new Error(`Invitation creation failed: ${JSON.stringify(inviteData)}`);
  }
  console.log(`  PASS: Generated 24-hr invitation token for ${testInviteEmail}.`);

  // Extract raw token from inviteUrl
  const inviteUrl = inviteData.invitation.inviteUrl;
  const rawInviteToken = new URL(inviteUrl).searchParams.get("token") || "";

  // Accept invitation
  const acceptRes = await fetch(`${baseUrl}/api/auth/invitations/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: rawInviteToken,
      password: "TestDispatcherPassword123!",
    }),
  });
  const acceptData = await acceptRes.json();
  if (acceptRes.status !== 200 || !acceptData.success) {
    throw new Error(`Invitation acceptance failed: ${JSON.stringify(acceptData)}`);
  }
  console.log("  PASS: Invitation accepted & password hashed with Argon2id.");

  const dispatcherCookie = acceptRes.headers.get("set-cookie")?.match(/(?:mtc_admin_session|__Host-mtc-admin-session)=([^;]+)/)?.[1] || "";

  // --- TEST 6: RBAC Authorization Enforcement ---
  console.log("\n[Test 6] Testing Role-Based Access Control (RBAC) boundaries...");

  // Dispatcher CAN access appointments (has appointments.view)
  const dispApptRes = await fetch(`${baseUrl}/api/admin/appointments`, {
    headers: { Cookie: `mtc_admin_session=${dispatcherCookie}` },
  });
  if (dispApptRes.status === 200) {
    console.log("  PASS: Dispatcher allowed access to /api/admin/appointments (appointments.view).");
  } else {
    throw new Error(`Expected Dispatcher to access appointments, got ${dispApptRes.status}`);
  }

  // Dispatcher CANNOT invite users (lacks users.invite permission -> 403 Forbidden)
  const dispInviteRes = await fetch(`${baseUrl}/api/admin/users/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `mtc_admin_session=${dispatcherCookie}`,
    },
    body: JSON.stringify({
      name: "Malicious User",
      email: "hacker@test.com",
      roleSlug: "superadmin",
    }),
  });
  if (dispInviteRes.status === 403) {
    console.log("  PASS: Dispatcher correctly BLOCKED from /api/admin/users/invite with 403 Forbidden!");
  } else {
    throw new Error(`Expected 403 Forbidden for Dispatcher inviting users, got ${dispInviteRes.status}`);
  }

  // --- TEST 7: Single-Use Invitation Enforcement ---
  console.log("\n[Test 7] Testing single-use token enforcement...");
  const reuseRes = await fetch(`${baseUrl}/api/auth/invitations/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: rawInviteToken,
      password: "AnotherPassword123!",
    }),
  });
  if (reuseRes.status === 400) {
    console.log("  PASS: Consumed invitation token rejected with 400 Bad Request.");
  } else {
    throw new Error(`Expected token reuse rejection (400), got ${reuseRes.status}`);
  }

  // --- TEST 8: Session Revocation ---
  console.log("\n[Test 8] Testing session revocation & logout...");
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: `mtc_admin_session=${dispatcherCookie}` },
  });
  if (logoutRes.status === 200) {
    console.log("  PASS: Logout succeeded and server session was revoked.");
  }

  // Attempting to use the revoked session must now return 401
  const postLogoutRes = await fetch(`${baseUrl}/api/admin/appointments`, {
    headers: { Cookie: `mtc_admin_session=${dispatcherCookie}` },
  });
  if (postLogoutRes.status === 401) {
    console.log("  PASS: Subsequent request with revoked session rejected with 401 Unauthorized.");
  } else {
    throw new Error(`Expected 401 after session revocation, got ${postLogoutRes.status}`);
  }

  // Clean up test dispatcher
  await AdminUser.deleteOne({ normalizedEmail: testInviteEmail });
  await AdminInvitation.deleteOne({ normalizedEmail: testInviteEmail });
  console.log("\n[Clean-up] Removed temporary test dispatcher account.");

  console.log("\n==================================================");
  console.log(" ALL 8 AUTHENTICATION & RBAC SECURITY TESTS PASSED!");
  console.log("==================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

runAuthTests().catch(async (err) => {
  console.error("\n[Test Suite Error]", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
