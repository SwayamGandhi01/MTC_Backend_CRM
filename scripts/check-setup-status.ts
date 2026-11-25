import fs from "fs";
import path from "path";
import mongoose from "mongoose";

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

async function check() {
  loadLocalEnv();
  const { connectToDatabase } = await import("../src/lib/db/mongodb");
  const { AdminUser } = await import("../src/models");

  await connectToDatabase();
  const superAdmins = await AdminUser.find({
    $or: [{ isSuperAdmin: true }, { role: "superadmin" }],
  });

  console.log("Current Super Admins count:", superAdmins.length);
  for (const sa of superAdmins) {
    console.log("Found:", sa.email, "| Status:", sa.status);
  }

  // If the pre-seeded CLI bootstrap user exists, clear it so the real user can register on /setup/initial-admin
  if (superAdmins.length > 0) {
    console.log("Cleaning pre-seeded demo admin user to enable user first-time registration on /setup/initial-admin...");
    await AdminUser.deleteMany({ email: "admin@mobiletyrechampions.com" });
    console.log("Cleaned. Database is now ready for initial Super Admin self-registration.");
  }

  await mongoose.disconnect();
  process.exit(0);
}

check().catch(console.error);
