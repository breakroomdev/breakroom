import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { roleHasPermission, type Permission } from "@/lib/permissions";
import { AuthError } from "./session";

export class ForbiddenError extends Error {
  status = 403;
}

export type Membership = {
  member: typeof schema.workspaceMembers.$inferSelect;
  role: typeof schema.roles.$inferSelect;
  workspace: typeof schema.workspaces.$inferSelect;
};

/** Looks up a user's active membership + role in a workspace by slug. */
export async function getMembership(userId: string, workspaceSlug: string): Promise<Membership | null> {
  const db = await getDb();

  const workspace = await db.query.workspaces.findFirst({
    where: eq(schema.workspaces.slug, workspaceSlug),
  });
  if (!workspace) return null;

  const rows = await db
    .select({ member: schema.workspaceMembers, role: schema.roles })
    .from(schema.workspaceMembers)
    .innerJoin(schema.roles, eq(schema.roles.id, schema.workspaceMembers.roleId))
    .where(and(eq(schema.workspaceMembers.workspaceId, workspace.id), eq(schema.workspaceMembers.userId, userId)))
    .limit(1);

  const row = rows[0];
  if (!row || row.member.status !== "active") return null;

  return { member: row.member, role: row.role, workspace };
}

/** Throws ForbiddenError unless the membership's role grants `permission`. */
export function requirePermission(membership: Membership, permission: Permission): void {
  if (!roleHasPermission(membership.role.permissions, permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
}

/** Convenience: fetch the current user's membership for a workspace, or throw. */
export async function requireMembership(userId: string, workspaceSlug: string): Promise<Membership> {
  const membership = await getMembership(userId, workspaceSlug);
  if (!membership) throw new AuthError("Not a member of this workspace");
  return membership;
}
