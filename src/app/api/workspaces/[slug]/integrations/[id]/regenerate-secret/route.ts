import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { regenerateIntegrationSecret } from "@/lib/services/integrations";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const POST = withErrorHandling(async (req: Request, { params }: { params: { slug: string; id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const secret = await regenerateIntegrationSecret(membership.workspace.id, params.id);
  if (!secret) return jsonError("Integration not found", 404);

  // Shown once — the previous secret's hash was already overwritten, so it stops working immediately.
  return jsonOk({ secret });
});
