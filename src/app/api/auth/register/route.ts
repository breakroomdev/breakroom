import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { registerSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createWorkspace, generateUniqueSlug, addMemberToWorkspace } from "@/lib/workspace-service";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/api/csrf";
import { hashToken } from "@/lib/auth/tokens";

export const POST = withErrorHandling(async (req: Request) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const limit = rateLimit(`register:${clientIp(req.headers)}`, 5, 10 * 60 * 1000);
  if (!limit.success) return jsonError("Too many attempts. Try again later.", 429);

  const body = registerSchema.parse(await req.json());
  const db = await getDb();

  const [emailTaken, usernameTaken] = await Promise.all([
    db.query.users.findFirst({ where: eq(schema.users.email, body.email.toLowerCase()) }),
    db.query.users.findFirst({ where: eq(schema.users.username, body.username.toLowerCase()) }),
  ]);
  if (emailTaken) return jsonError("An account with that email already exists.", 409);
  if (usernameTaken) return jsonError("That username is taken.", 409);

  let invite: typeof schema.invites.$inferSelect | undefined;
  if (body.invite) {
    const tokenHash = await hashToken(body.invite);
    invite = await db.query.invites.findFirst({ where: eq(schema.invites.tokenHash, tokenHash) });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      return jsonError("This invite link is invalid or has expired.", 400);
    }
  }

  let joinWorkspace: typeof schema.workspaces.$inferSelect | undefined;
  if (!invite && body.joinWorkspaceSlug) {
    joinWorkspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, body.joinWorkspaceSlug) });
    if (!joinWorkspace) return jsonError("That workspace couldn't be found.", 404);
    const settings = await db.query.workspaceSettings.findFirst({ where: eq(schema.workspaceSettings.workspaceId, joinWorkspace.id) });
    if (settings && !settings.allowSelfRegistration) {
      return jsonError("This workspace requires an invite to join.", 403);
    }
  }

  const passwordHash = await hashPassword(body.password);

  const [user] = await db
    .insert(schema.users)
    .values({
      email: body.email.toLowerCase(),
      username: body.username.toLowerCase(),
      passwordHash,
      displayName: body.displayName,
    })
    .returning();

  if (!user) return jsonError("Could not create account", 500);

  let workspaceSlug: string | null = null;

  if (invite) {
    const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, invite.workspaceId) });
    if (workspace) {
      const db2 = await getDb();
      await db2.insert(schema.workspaceMembers).values({ workspaceId: workspace.id, userId: user.id, roleId: invite.roleId });
      await db2.update(schema.invites).set({ acceptedAt: new Date() }).where(eq(schema.invites.id, invite.id));
      workspaceSlug = workspace.slug;
    }
  } else if (joinWorkspace) {
    await addMemberToWorkspace(joinWorkspace.id, user.id, "employee");
    workspaceSlug = joinWorkspace.slug;
  } else if (body.workspaceName) {
    const slug = body.workspaceSlug ? await generateUniqueSlug(body.workspaceSlug) : undefined;
    const workspace = await createWorkspace({ name: body.workspaceName, ownerId: user.id, slug });
    workspaceSlug = workspace.slug;
  }

  await createSession(user.id);

  return jsonOk({ user: { id: user.id, username: user.username, displayName: user.displayName }, workspaceSlug });
});
