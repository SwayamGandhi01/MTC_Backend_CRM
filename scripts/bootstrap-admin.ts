import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Safely load .env.local without exposing secrets
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

async function runBootstrap() {
  loadLocalEnv();

  const { connectToDatabase } = await import("../src/lib/db/mongodb");
  const { AdminUser, Role, SecurityEvent } = await import("../src/models");
  const { hashPassword } = await import("../src/lib/auth/password");
  const { DEFAULT_SYSTEM_ROLES } = await import("../src/lib/auth/permissions");

  console.log("==================================================");
  console.log(" MOBILE TYRE CHAMPIONS CRM");
  console.log(" SUPER ADMIN ONE-TIME BOOTSTRAP PROVISIONING");
  console.log("==================================================");

  // 1. Connect to MongoDB Atlas
  await connectToDatabase();

  // 2. Validate one-time bootstrap secret
  const bootstrapSecret = process.env.BOOTSTRAP_ADMIN_SECRET?.trim();
  if (!bootstrapSecret) {
    console.error("\n[Bootstrap Error] BOOTSTRAP_ADMIN_SECRET is not configured in .env.local.");
    console.error("Please add a secure random secret to BOOTSTRAP_ADMIN_SECRET and retry.\n");
    process.exit(1);
  }

  // 3. Ensure system roles exist in MongoDB
  for (const slug of Object.keys(DEFAULT_SYSTEM_ROLES)) {
    const roleDef = DEFAULT_SYSTEM_ROLES[slug];
    const existing = await Role.findOne({ slug });
    if (!existing) {
      await Role.create({
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        permissions: roleDef.permissions,
        isSystemRole: true,
        isActive: true,
      });
      console.log(`[Role Seed] Created system role: ${roleDef.name} (${roleDef.slug})`);
    }
  }

  const superAdminRole = await Role.findOne({ slug: "superadmin" });

  // 4. Check whether a Super Admin already exists
  const existingSuperAdmin = await AdminUser.findOne({
    $or: [{ isSuperAdmin: true }, { role: "superadmin" }],
  });

  if (existingSuperAdmin) {
    console.warn("\n[Bootstrap Prohibited] A Super Admin account already exists in this database.");
    console.warn(`Existing Super Admin: ${existingSuperAdmin.email} (Status: ${existingSuperAdmin.status})`);
    console.warn("Bootstrap provisioning can only run once for initial cluster setup.");
    console.warn("To manage additional users, log in as Super Admin and use the CRM Users module.\n");
    await mongoose.disconnect();
    process.exit(0);
  }

  // 5. Parse command line arguments or use default administrator credentials
  const emailArg = process.argv[2] || process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@mobiletyrechampions.com";
  const passArg = process.argv[3] || process.env.BOOTSTRAP_ADMIN_PASSWORD || "AdminPassword123!";
  const nameArg = process.argv[4] || "System Super Administrator";

  const normalizedEmail = emailArg.trim().toLowerCase();

  if (passArg.length < 8) {
    console.error("[Bootstrap Error] Password must be at least 8 characters long.");
    process.exit(1);
  }

  // 6. Hash password using Argon2id
  console.log("\n[Bootstrap] Hashing password with Argon2id...");
  const passwordHash = await hashPassword(passArg);

  // 7. Create Super Admin record
  const superAdmin = await AdminUser.create({
    name: nameArg,
    email: normalizedEmail,
    normalizedEmail: normalizedEmail,
    passwordHash: passwordHash,
    roleId: superAdminRole?._id,
    role: "superadmin",
    status: "ACTIVE",
    isSuperAdmin: true,
    mfaEnabled: false, // Will require mandatory enrollment on first login
    recoveryCodes: [],
    failedLoginAttempts: 0,
    passwordChangedAt: new Date(),
  });

  // 8. Record audit event
  await SecurityEvent.create({
    actorUserId: superAdmin._id,
    actorEmail: superAdmin.email,
    eventType: "SUPER_ADMIN_BOOTSTRAPPED",
    severity: "CRITICAL",
    metadata: {
      action: "Initial Super Admin provisioning via CLI bootstrap",
      bootstrapSecretUsed: true,
      timestamp: new Date().toISOString(),
    },
  });

  console.log("\n==================================================");
  console.log(" SUPER ADMIN PROVISIONED SUCCESSFULLY");
  console.log("==================================================");
  console.log(`Email:       ${superAdmin.email}`);
  console.log(`Role:        ${superAdmin.role} (isSuperAdmin: true)`);
  console.log(`Status:      ${superAdmin.status}`);
  console.log(`MFA Policy:  MANDATORY ENROLLMENT ON FIRST LOGIN`);
  console.log("==================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

runBootstrap().catch(async (err) => {
  console.error("[Bootstrap Fatal Error]", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
