import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { connectRobloxIntegrationSchema } from "@/lib/validation/integrations";
import { listIntegrations, createIntegration, computeIntegrationStatus } from "@/lib/services/integrations";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { slug: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const rows = await listIntegrations(membership.workspace.id);

  return jsonOk({
    integrations: rows.map((row) => ({
      id: row.id,
      type: row.type,
      name: row.name,
      enabled: row.enabled,
      config: row.config,
      status: computeIntegrationStatus(row),
      secretLastFour: row.secretLastFour,
      lastActivityAt: row.lastActivityAt?.getTime() ?? null,
      lastErrorAt: row.lastErrorAt?.getTime() ?? null,
      lastError: row.lastError,
      messageCount: row.messageCount,
      createdAt: row.createdAt.getTime(),
    })),
  });
});

// Only Roblox Chat Logger can be created through this endpoint today — new
// integration types get their own connect flow, but land in the same table.
export const POST = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { userId, membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const body = connectRobloxIntegrationSchema.parse(await req.json());

  const { integration, secret } = await createIntegration({
    workspaceId: membership.workspace.id,
    type: "roblox_chat",
    name: body.name,
    config: { universeId: body.universeId, placeId: body.placeId },
    createdBy: userId,
  });

  return jsonOk(
    {
      integration: {
        id: integration.id,
        type: integration.type,
        name: integration.name,
        enabled: integration.enabled,
        config: integration.config,
        status: computeIntegrationStatus(integration),
      },
      secret, // shown once — the caller must save it now, it's never returned again
    },
    201
  );
});
