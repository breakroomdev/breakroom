/**
 * Lightweight CSRF mitigation for JSON API routes.
 *
 * Breakroom's session cookie is SameSite=Lax, which already blocks the
 * cookie from being sent on cross-site POST/PUT/DELETE requests in every
 * modern browser. As defense in depth, state-changing routes should also
 * call this to confirm the request actually originated from the app's own
 * origin (rather than relying on SameSite alone).
 */
export function isSameOriginRequest(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin requests, curl, server-to-server: no Origin header

  const appUrl = process.env.APP_URL;
  const allowed = new Set([appUrl, req.headers.get("x-forwarded-host") ? `https://${req.headers.get("x-forwarded-host")}` : null].filter(Boolean));

  try {
    const requestHost = new URL(req.url).host;
    const originHost = new URL(origin).host;
    if (requestHost === originHost) return true;
  } catch {
    // fall through to allowlist check
  }

  return [...allowed].some((a) => a && new URL(a).host === new URL(origin).host);
}
