import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission, ForbiddenError } from "@/lib/auth/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

const updateRoleSchema = z.object({ permissions: z.array(z.enum(PERMISSIONS)) });

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const db = await getDb();
  const role = await db.query.roles.findFirst({ where: eq(schema.roles.id, params.id) });
  if (!role || !role.workspaceId) return jsonError("Role not found", 404);
  if (role.isSystem) throw new ForbiddenError("The Owner role can't be edited.");

  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, role.workspaceId) });
  if (!workspace) return jsonError("Workspace not found", 404);

  const membership = await getMembership(user.id, workspace.slug);
  if (!membership) return jsonError("Not a member", 403);
  requirePermission(membership, "roles.manage");

  const { permissions } = updateRoleSchema.parse(await req.json());
  const [updated] = await db.update(schema.roles).set({ permissions }).where(eq(schema.roles.id, params.id)).returning();

  return jsonOk({ role: updated });
});
