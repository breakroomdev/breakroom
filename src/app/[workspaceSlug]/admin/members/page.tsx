import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { MembersManager } from "@/components/admin/members-manager";

export const metadata = { title: "Manage members" };

export default async function AdminMembersPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");
  requirePermission(membership, "members.manage");

  const db = await getDb();
  const [rows, roles] = await Promise.all([
    db
      .select({ member: schema.workspaceMembers, user: schema.users, role: schema.roles })
      .from(schema.workspaceMembers)
      .innerJoin(schema.users, eq(schema.users.id, schema.workspaceMembers.userId))
      .innerJoin(schema.roles, eq(schema.roles.id, schema.workspaceMembers.roleId))
      .where(eq(schema.workspaceMembers.workspaceId, membership.workspace.id)),
    db.query.roles.findMany({ where: eq(schema.roles.workspaceId, membership.workspace.id) }),
  ]);

  const members = rows.map((r) => ({
    id: r.member.id,
    status: r.member.status,
    joinedAt: r.member.joinedAt.getTime(),
    user: { id: r.user.id, displayName: r.user.displayName, username: r.user.username, email: r.user.email, avatarUrl: r.user.avatarUrl },
    role: { id: r.role.id, key: r.role.key, name: r.role.name },
  }));

  return (
    <MembersManager
      initialMembers={members}
      roles={roles.map((r) => ({ id: r.id, key: r.key, name: r.name }))}
      ownerId={membership.workspace.ownerId}
      currentUserId={user.id}
    />
  );
}
