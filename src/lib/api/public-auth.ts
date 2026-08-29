import "server-only";
import { schema } from "@/lib/db";
import { findIntegrationBySecret } from "@/lib/services/integrations";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError } from "@/lib/api/response";

export type ApiApp = typeof schema.integrations.$inferSelect;

/**
 * Authenticates a public API request via `Authorization: Bearer <key>`,
 * scoping it to the workspace that key belongs to. No CSRF check here —
 * these are server-to-server, Bearer-authenticated calls, not
 * cookie-authenticated browser requests, so CSRF doesn't apply (matches
 * the existing Roblox chat ingest endpoint's precedent).
 */
export async function authenticateApiApp(req: Request): Promise<{ app: ApiApp } | { error: Response }> {
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!secret) return { error: jsonError("Missing or invalid Authorization header", 401) };

  const app = await findIntegrationBySecret("api_app", secret);
  if (!app) return { error: jsonError("Invalid API key", 401) };
  if (!app.enabled) return { error: jsonError("This API key is disabled", 403) };

  const limit = rateLimit(`public-api:${app.id}`, 60, 60 * 1000);
  if (!limit.success) return { error: jsonError("Too many requests. Please slow down.", 429) };

  return { app };
}
