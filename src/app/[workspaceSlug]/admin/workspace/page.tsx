import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { WorkspaceSettingsForm } from "@/components/admin/workspace-settings-form";

export const metadata = { title: "Workspace settings" };

export default async function AdminWorkspacePage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");
  requirePermission(membership, "workspace.manage");

  return (
    <WorkspaceSettingsForm
      initial={{
        name: membership.workspace.name,
        description: membership.workspace.description,
        logoUrl: membership.workspace.logoUrl,
        theme: membership.workspace.theme,
      }}
    />
  );
}
