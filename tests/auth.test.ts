import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { handleAuthMiddleware, resolveAuthRedirect } from "@/lib/auth/guard";

describe("Authentication & Security (M0)", () => {
  it("(a) hashes a password and verifies matching vs non-matching passwords", async () => {
    const plain = "TestPassword!2026";
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await verifyPassword(plain, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword!2026", hash);
    expect(isWrongMatch).toBe(false);
  });

  it("(b) blocks unauthenticated access to protected routes (/jobs) and redirects to /login", async () => {
    expect(resolveAuthRedirect("/jobs", false)).toBe("/login");
    expect(resolveAuthRedirect("/jobs", true)).toBeNull();
    expect(resolveAuthRedirect("/login", false)).toBeNull();
    expect(resolveAuthRedirect("/login", true)).toBe("/jobs");

    const unauthRequest = new NextRequest(new URL("http://localhost:3000/jobs"));
    const response = await handleAuthMiddleware(unauthRequest);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
