import { eq } from "drizzle-orm";
import { db, sqlite } from "./index";
import { users } from "./schema";
import { hashPassword } from "../lib/auth/password";
import crypto from "crypto";
import fs from "fs";
import path from "path";

function loadEnvIfNeeded() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }
  const content = fs.readFileSync(envPath, "utf-8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

async function seedAdmin() {
  loadEnvIfNeeded();

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables are required."
    );
    sqlite.close();
    process.exit(1);
  }

  const passwordHash = await hashPassword(adminPassword);
  const existing = db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .get();

  const now = new Date().toISOString();

  if (existing) {
    db.update(users)
      .set({
        password_hash: passwordHash,
        role: "admin",
      })
      .where(eq(users.id, existing.id))
      .run();
    console.log(`Updated admin account for ${adminEmail}.`);
  } else {
    db.insert(users)
      .values({
        id: crypto.randomUUID(),
        email: adminEmail,
        password_hash: passwordHash,
        role: "admin",
        created_at: now,
      })
      .run();
    console.log(`Created admin account for ${adminEmail}.`);
  }

  sqlite.close();
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin user:", err instanceof Error ? err.message : "Unknown error");
  sqlite.close();
  process.exit(1);
});
