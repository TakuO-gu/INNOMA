import { NextRequest, NextResponse } from "next/server";

function unauthorizedResponse(realm?: string) {
  const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (realm) {
    response.headers.set("WWW-Authenticate", `Basic realm="${realm}"`);
  }
  return response;
}

function serverConfigError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const basicToken = process.env.ADMIN_BASIC_AUTH;

  const hasBasic = basicToken && authHeader === `Basic ${basicToken}`;

  return Boolean(hasBasic);
}

function isCronAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/cron/update-municipalities")) {
    if (!process.env.CRON_SECRET) {
      return serverConfigError("CRON_SECRET is not configured");
    }
    if (!isCronAuthorized(request)) {
      return unauthorizedResponse();
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!process.env.ADMIN_BASIC_AUTH) {
      return serverConfigError("Admin auth is not configured");
    }
    if (!isAuthorized(request)) {
      return unauthorizedResponse("INNOMA Admin");
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/cron/update-municipalities"],
};
