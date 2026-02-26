import { NextRequest, NextResponse } from "next/server";
import pageRegistryData from "./data/artifacts/_templates/page-registry.json";

// 旧フラットURL → 新カテゴリURLのリダイレクトマップを構築
// 非topicページのslugをカテゴリ付きパスにマッピング
const flatSlugRedirects = new Map<string, string>();
for (const [slug, entry] of Object.entries(pageRegistryData)) {
  const typedEntry = entry as { filePath: string; categories?: string[]; type?: string };
  if (typedEntry.type === "topic") continue;
  const category = typedEntry.categories?.[0];
  if (category) {
    flatSlugRedirects.set(slug, `/${category}/${slug}`);
  }
}

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

  // 旧フラットURL → 新カテゴリURLへの301リダイレクト
  // パターン: /{municipality}/{slug} で slug が非topicのregistryエントリに一致
  const pathParts = pathname.split("/").filter(Boolean);
  if (pathParts.length === 2) {
    const [municipality, slug] = pathParts;
    // 特殊パスは除外
    if (!["admin", "api", "_next", "search"].includes(municipality)) {
      const newPath = flatSlugRedirects.get(slug);
      if (newPath) {
        const url = request.nextUrl.clone();
        url.pathname = `/${municipality}${newPath}`;
        return NextResponse.redirect(url, 301);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/cron/update-municipalities",
    "/:municipality/:path*",
  ],
};
