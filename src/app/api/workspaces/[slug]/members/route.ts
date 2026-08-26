import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { inviteMemberSchema } from "@/lib/validation/workspace";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { slug: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "members.manage");

  const db = await getDb();
  const rows = await db
    .select({ member: schema.workspaceMembers, user: schema.users, role: schema.roles })
    .from(schema.workspaceMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.workspaceMembers.userId))
    .innerJoin(schema.roles, eq(schema.roles.id, schema.workspaceMembers.roleId))
    .where(eq(schema.workspaceMembers.workspaceId, membership.workspace.id));

  const invites = await db.query.invites.findMany({ where: eq(schema.invites.workspaceId, membership.workspace.id) });

  return jsonOk({
    members: rows.map((r) => ({
      id: r.member.id,
      status: r.member.status,
      joinedAt: r.member.joinedAt.getTime(),
      user: { id: r.user.id, displayName: r.user.displayName, username: r.user.username, email: r.user.email, avatarUrl: r.user.avatarUrl },
      role: { id: r.role.id, key: r.role.key, name: r.role.name },
    })),
    pendingInvites: invites
      .filter((i) => !i.acceptedAt && i.expiresAt.getTime() > Date.now())
      .map((i) => ({ id: i.id, email: i.email, createdAt: i.createdAt.getTime() })),
    roles: await db.query.roles.findMany({ where: eq(schema.roles.workspaceId, membership.workspace.id) }),
  });
});

export const POST = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { userId, membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "members.manage");

  const body = inviteMemberSchema.parse(await req.json());
  const db = await getDb();

  const token = generateToken();
  const tokenHash = await hashToken(token);

  await db.insert(schema.invites).values({
    workspaceId: membership.workspace.id,
    email: body.email.toLowerCase(),
    roleId: body.roleId,
    tokenHash,
    invitedBy: userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const inviteUrl = `${process.env.APP_URL}/join/${token}`;
  await sendEmail(
    body.email,
    `You're invited to join ${membership.workspace.name} on Breakroom`,
    `You've been invited to join ${membership.workspace.name}.\n\nAccept your invite:\n${inviteUrl}\n\nThis link expires in 7 days.`
  );

  return jsonOk({ inviteUrl }, 201);
});
