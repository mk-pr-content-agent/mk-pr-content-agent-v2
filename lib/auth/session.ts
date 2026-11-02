import crypto from "crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { SessionData } from "./session-options";

type SessionUser = NonNullable<SessionData["user"]>;

let cachedDefaultUser: SessionUser | null = null;

function getOrCreateDefaultUser(): SessionUser {
  if (cachedDefaultUser) {
    return cachedDefaultUser;
  }

  const existing = db.select().from(users).get();
  if (existing) {
    cachedDefaultUser = {
      id: existing.id,
      email: existing.email,
      role: existing.role,
    };
    return cachedDefaultUser;
  }

  const id = crypto.randomUUID();
  const email = "admin@mk.co.kr";
  db.insert(users)
    .values({
      id,
      email,
      password_hash: "disabled-auth-temporarily",
      role: "admin",
      created_at: new Date().toISOString(),
    })
    .run();

  cachedDefaultUser = {
    id,
    email,
    role: "admin",
  };
  return cachedDefaultUser;
}

export async function getSession() {
  const user = getOrCreateDefaultUser();
  return {
    user,
    save: async () => {},
    destroy: () => {},
  };
}
