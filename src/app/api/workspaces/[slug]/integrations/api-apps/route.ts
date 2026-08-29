import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { connectApiAppSchema } from "@/lib/validation/integrations";
import { createIntegration, computeIntegrationStatus } from "@/lib/services/integrations";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const POST = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { userId, membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const body = connectApiAppSchema.parse(await req.json());

  const { integration, secret } = await createIntegration({
    workspaceId: membership.workspace.id,
    type: "api_app",
    name: body.name,
    config: body.description ? { description: body.description } : {},
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
