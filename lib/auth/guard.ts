import { getIronSession } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionOptions, type SessionData } from "./session-options";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

export function isPublicPath(pathname: string): boolean {
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/assets")
  ) {
    return true;
  }
  return PUBLIC_PATHS.some(
    (publicPath) =>
      pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );
}

export function resolveAuthRedirect(
  pathname: string,
  isAuthenticated: boolean
): string | null {
  if (pathname === "/") {
    return isAuthenticated ? "/jobs" : "/login";
  }

  if (!isAuthenticated && !isPublicPath(pathname)) {
    return "/login";
  }

  if (isAuthenticated && pathname === "/login") {
    return "/jobs";
  }

  return null;
}

export async function handleAuthMiddleware(
  request: NextRequest
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/assets")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    getSessionOptions()
  );

  const isAuthenticated = Boolean(session.user?.id);
  const redirectTarget = resolveAuthRedirect(pathname, isAuthenticated);

  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  return response;
}
