import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission, ForbiddenError } from "@/lib/auth/authorize";
import { updateMemberSchema } from "@/lib/validation/workspace";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const db = await getDb();
  const member = await db.query.workspaceMembers.findFirst({ where: eq(schema.workspaceMembers.id, params.id) });
  if (!member) return jsonError("Member not found", 404);

  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, member.workspaceId) });
  if (!workspace) return jsonError("Workspace not found", 404);

  const membership = await getMembership(user.id, workspace.slug);
  if (!membership) return jsonError("Not a member", 403);
  requirePermission(membership, "members.manage");

  if (member.userId === workspace.ownerId) {
    throw new ForbiddenError("The workspace owner's role can't be changed here.");
  }

  const body = updateMemberSchema.parse(await req.json());
  const [updated] = await db.update(schema.workspaceMembers).set(body).where(eq(schema.workspaceMembers.id, params.id)).returning();

  return jsonOk({ member: updated });
});

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const db = await getDb();
  const member = await db.query.workspaceMembers.findFirst({ where: eq(schema.workspaceMembers.id, params.id) });
  if (!member) return jsonError("Member not found", 404);

  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, member.workspaceId) });
  if (!workspace) return jsonError("Workspace not found", 404);

  const membership = await getMembership(user.id, workspace.slug);
  if (!membership) return jsonError("Not a member", 403);
  requirePermission(membership, "members.manage");

  if (member.userId === workspace.ownerId) {
    throw new ForbiddenError("The workspace owner can't be removed.");
  }

  await db.delete(schema.workspaceMembers).where(eq(schema.workspaceMembers.id, params.id));
  return jsonOk({ success: true });
});
