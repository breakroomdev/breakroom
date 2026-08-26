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
]);
