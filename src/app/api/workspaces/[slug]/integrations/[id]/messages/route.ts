import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { getIntegration } from "@/lib/services/integrations";
import { listRobloxMessages, listNewRobloxMessages } from "@/lib/services/roblox";
import { listRobloxMessagesQuerySchema } from "@/lib/validation/integrations";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";

function serializeMessage(m: { id: string; userId: number; username: string; displayName: string; message: string; jobId: string; timestamp: Date }) {
  return {
    id: m.id,
    userId: m.userId,
    username: m.username,
    displayName: m.displayName,
    message: m.message,
    jobId: m.jobId,
    timestamp: m.timestamp.getTime(),
  };
}

// Any active workspace member can read the chat log — configuring the integration is what's admin-gated.
export const GET = withErrorHandling(async (req: Request, { params }: { params: { slug: string; id: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);

  const integration = await getIntegration(membership.workspace.id, params.id);
  if (!integration || integration.type !== "roblox_chat") return jsonError("Integration not found", 404);

  const url = new URL(req.url);
  const since = url.searchParams.get("since");

  if (since) {
    const sinceDate = new Date(Number(since));
    if (Number.isNaN(sinceDate.getTime())) return jsonError("Invalid 'since' value", 422);
    const messages = await listNewRobloxMessages(integration.id, sinceDate);
    return jsonOk({ messages: messages.map(serializeMessage) });
  }

  const query = listRobloxMessagesQuerySchema.parse(Object.fromEntries(url.searchParams));
  const { messages, nextCursor } = await listRobloxMessages(integration.id, {
    cursor: query.cursor,
    q: query.q,
    username: query.username,
    jobId: query.jobId,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    limit: query.limit,
  });

  return jsonOk({ messages: messages.map(serializeMessage), nextCursor });
});
