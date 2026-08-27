import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { AdminNav } from "@/components/admin/admin-nav";
import { getWorkspaceBasePath } from "@/lib/workspace-base-path";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const perms = membership.role.permissions;
  const hasAnyAdminAccess = ["workspace.manage", "members.manage", "roles.manage", "schedule.manage", "posts.moderate"].some((p) => perms.includes(p as never));
  const basePath = getWorkspaceBasePath(params.workspaceSlug);
  if (!hasAnyAdminAccess) redirect(basePath || "/");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">Manage {membership.workspace.name}.</p>
      </div>
      <AdminNav basePath={basePath} permissions={perms} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
