import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { RolesManager } from "@/components/admin/roles-manager";

export const metadata = { title: "Manage roles" };

export default async function AdminRolesPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");
  requirePermission(membership, "roles.manage");

  const db = await getDb();
  const roles = await db.query.roles.findMany({ where: eq(schema.roles.workspaceId, membership.workspace.id) });

  return <RolesManager roles={roles.map((r) => ({ id: r.id, key: r.key, name: r.name, permissions: r.permissions, isSystem: r.isSystem }))} />;
}
