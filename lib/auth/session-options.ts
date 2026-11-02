import type { SessionOptions } from "iron-session";

export interface SessionData {
  user?: {
    id: string;
    email: string;
    role: "admin" | "editor";
  };
}

export const SESSION_COOKIE_NAME = "mk_pr_session";

export function getSessionOptions(): SessionOptions {
  const secret =
    process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32
      ? process.env.SESSION_SECRET
      : "dev-fallback-session-secret-must-be-at-least-32-chars";

  return {
    password: secret,
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}
