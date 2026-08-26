import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";

async function findInvite(token: string) {
  const db = await getDb();
  const tokenHash = await hashToken(token);
  return db.query.invites.findFirst({
    where: and(eq(schema.invites.tokenHash, tokenHash), isNull(schema.invites.acceptedAt), gt(schema.invites.expiresAt, new Date())),
  });
}

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { token: string } }) => {
  const invite = await findInvite(params.token);
  if (!invite) return jsonError("This invite link is invalid or has expired.", 404);

  const db = await getDb();
  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, invite.workspaceId) });
  const role = await db.query.roles.findFirst({ where: eq(schema.roles.id, invite.roleId) });

  return jsonOk({ email: invite.email, workspaceName: workspace?.name, roleName: role?.name });
});

export const POST = withErrorHandling(async (_req: Request, { params }: { params: { token: string } }) => {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in first to accept this invite.", 401);

  const invite = await findInvite(params.token);
  if (!invite) return jsonError("This invite link is invalid or has expired.", 404);

  const db = await getDb();
  const existing = await db.query.workspaceMembers.findFirst({
    where: and(eq(schema.workspaceMembers.workspaceId, invite.workspaceId), eq(schema.workspaceMembers.userId, user.id)),
  });
  if (!existing) {
    await db.insert(schema.workspaceMembers).values({ workspaceId: invite.workspaceId, userId: user.id, roleId: invite.roleId });
  }
  await db.update(schema.invites).set({ acceptedAt: new Date() }).where(eq(schema.invites.id, invite.id));

  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, invite.workspaceId) });
  return jsonOk({ workspaceSlug: workspace?.slug });
});
