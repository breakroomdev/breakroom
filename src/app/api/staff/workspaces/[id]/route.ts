import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { requireSiteAdmin } from "@/lib/auth/authorize";
import { setWorkspaceVerifiedSchema } from "@/lib/validation/staff";
import { setWorkspaceVerified, deleteWorkspace } from "@/lib/services/staff";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  requireSiteAdmin(user);

  const workspace = await (await getDb()).query.workspaces.findFirst({ where: eq(schema.workspaces.id, params.id) });
  if (!workspace) return jsonError("Workspace not found", 404);

  const body = setWorkspaceVerifiedSchema.parse(await req.json());
  await setWorkspaceVerified(params.id, body.verified);

  return jsonOk({ success: true });
});

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  requireSiteAdmin(user);

  const workspace = await (await getDb()).query.workspaces.findFirst({ where: eq(schema.workspaces.id, params.id) });
  if (!workspace) return jsonError("Workspace not found", 404);

  await deleteWorkspace(params.id);

  return jsonOk({ success: true });
});
