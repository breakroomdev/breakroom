import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { updateIntegrationSchema } from "@/lib/validation/integrations";
import { getIntegration, updateIntegration, deleteIntegration, computeIntegrationStatus } from "@/lib/services/integrations";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

function serialize(row: NonNullable<Awaited<ReturnType<typeof getIntegration>>>) {
  return {
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
  };
}

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { slug: string; id: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const row = await getIntegration(membership.workspace.id, params.id);
  if (!row) return jsonError("Integration not found", 404);

  return jsonOk({ integration: serialize(row) });
});

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { slug: string; id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const body = updateIntegrationSchema.parse(await req.json());
  const updated = await updateIntegration(membership.workspace.id, params.id, body);
  if (!updated) return jsonError("Integration not found", 404);

  return jsonOk({ integration: serialize(updated) });
});

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { slug: string; id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const existing = await getIntegration(membership.workspace.id, params.id);
  if (!existing) return jsonError("Integration not found", 404);

  await deleteIntegration(membership.workspace.id, params.id);
  return jsonOk({ success: true });
});
