import "server-only";
import { headers } from "next/headers";
import { RESERVED_SLUGS } from "@/lib/constants";

/**
 * The path prefix to use for in-app links to the given workspace on *this*
 * request — "" when the request already arrived on that workspace's own
 * subdomain (so links should be root-relative), or "/{slug}" otherwise
 * (path-based deployments, or a request on the root domain). Mirrors the
 * rewrite logic in src/middleware.ts.
 */
export function getWorkspaceBasePath(slug: string): string {
  const host = (headers().get("host") ?? "").split(":")[0];
  return host && host.startsWith(`${slug}.`) ? "" : `/${slug}`;
}

/** The workspace slug implied by the current request's Host header, if it's a workspace subdomain. */
export function getRequestWorkspaceSlug(): string | null {
  let rootHost: string;
  try {
    rootHost = new URL(process.env.APP_URL ?? "").hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  if (!rootHost) return null;

  const host = (headers().get("host") ?? "").split(":")[0];
  if (!host || host === rootHost || host === `www.${rootHost}` || !host.endsWith(`.${rootHost}`)) return null;

  const slug = host.slice(0, -(rootHost.length + 1));
  if (!slug || slug.includes(".") || RESERVED_SLUGS.has(slug)) return null;
  return slug;
}
