/** Top-level route segments that a workspace slug must never collide with. */
export const RESERVED_SLUGS = new Set([
  "login",
  "register",
  "logout",
  "forgot-password",
  "reset-password",
  "join",
  "workspaces",
  "new-workspace",
  "api",
  "admin",
  "settings",
  "_next",
  "favicon.ico",
  "public",
  "assets",
  "search",
  "terms",
  "privacy",
  "staff",
  "help",
]);

/**
 * Actual top-level pages that exist outside `/[workspaceSlug]/...` — used by
 * middleware to decide what NOT to rewrite on a workspace subdomain. This is
 * narrower than RESERVED_SLUGS on purpose: words like "admin" and "settings"
 * are reserved so no workspace can be named that, but they're only real pages
 * *under* a workspace (`/{slug}/admin`), not at the root.
 */
export const ROOT_ROUTES = new Set([
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "join",
  "workspaces",
  "new-workspace",
  "staff",
  "terms",
  "privacy",
  "help",
]);
