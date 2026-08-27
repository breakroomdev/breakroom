import "server-only";
import { headers } from "next/headers";

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
