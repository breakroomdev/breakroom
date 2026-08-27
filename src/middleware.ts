import { NextRequest, NextResponse } from "next/server";
import { RESERVED_SLUGS } from "@/lib/constants";

/** The app's own root domain, derived from APP_URL (e.g. "breakroom.team"). */
function getRootHost(): string | null {
  try {
    return new URL(process.env.APP_URL ?? "").hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const rootHost = getRootHost();
  if (!rootHost) return NextResponse.next();

  const host = (req.headers.get("host") ?? "").split(":")[0];
  if (!host || host === rootHost || host === `www.${rootHost}` || !host.endsWith(`.${rootHost}`)) {
    return NextResponse.next();
  }

  const subdomain = host.slice(0, -(rootHost.length + 1));
  if (!subdomain || subdomain.includes(".") || RESERVED_SLUGS.has(subdomain)) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const firstSegment = pathname.split("/")[1] ?? "";

  // Already prefixed with the workspace slug, a reserved top-level route, an API
  // call (already slug-scoped in its own path), or a static file — leave alone.
  if (
    firstSegment === subdomain ||
    RESERVED_SLUGS.has(firstSegment) ||
    firstSegment.includes(".") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/")
  ) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${subdomain}` : `/${subdomain}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
