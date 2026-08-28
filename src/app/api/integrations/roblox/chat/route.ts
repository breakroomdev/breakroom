import { robloxChatIngestSchema } from "@/lib/validation/integrations";
import { findIntegrationBySecret, recordIntegrationError } from "@/lib/services/integrations";
import { recordRobloxChatMessage } from "@/lib/services/roblox";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Where the Roblox server script POSTs chat messages. Authenticated by the
 * integration secret (never a session cookie — this is called by a Roblox
 * game server, not a browser), so there's deliberately no CSRF check here.
 */
export const POST = withErrorHandling(async (req: Request) => {
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!secret) return jsonError("Missing or invalid Authorization header", 401);

  const integration = await findIntegrationBySecret("roblox_chat", secret);
  if (!integration) return jsonError("Invalid integration secret", 401);

  const limit = rateLimit(`roblox-chat:${integration.id}`, 120, 60 * 1000);
  if (!limit.success) return jsonError("Too many requests. Please slow down.", 429);

  if (!integration.enabled) return jsonError("This integration is disabled.", 403);

  const parsed = robloxChatIngestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    await recordIntegrationError(integration.id, `Rejected payload: ${parsed.error.issues[0]?.message ?? "invalid body"}`);
    return jsonError("Invalid request body", 422, parsed.error.flatten());
  }
  const body = parsed.data;

  const config = integration.config as { universeId?: string; placeId?: string };
  if (config.universeId !== body.universeId || config.placeId !== body.placeId) {
    await recordIntegrationError(integration.id, `Universe/Place ID mismatch (got ${body.universeId}/${body.placeId})`);
    return jsonError("Universe ID / Place ID do not match this integration's configuration", 403);
  }

  await recordRobloxChatMessage({
    workspaceId: integration.workspaceId,
    integrationId: integration.id,
    universeId: body.universeId,
    placeId: body.placeId,
    jobId: body.jobId,
    userId: body.userId,
    username: body.username,
    displayName: body.displayName,
    message: body.message,
    timestamp: new Date(body.timestamp),
  });

  return jsonOk({ success: true });
});
