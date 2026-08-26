import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const db = await getDb();
  const position = await db.query.positions.findFirst({ where: eq(schema.positions.id, params.id) });
  if (!position) return jsonError("Position not found", 404);

  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, position.workspaceId) });
  if (!workspace) return jsonError("Workspace not found", 404);

  const membership = await getMembership(user.id, workspace.slug);
  if (!membership) return jsonError("Not a member", 403);
  requirePermission(membership, "schedule.manage");

  await db.delete(schema.positions).where(eq(schema.positions.id, params.id));
  return jsonOk({ success: true });
});
