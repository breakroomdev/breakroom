import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { listHubLinks } from "@/lib/services/hub";
import { HubLinksManager } from "@/components/admin/hub-links-manager";

export const metadata = { title: "Manage Hub" };

export default async function AdminHubPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");
  requirePermission(membership, "workspace.manage");

  const links = await listHubLinks(membership.workspace.id);

  return (
    <HubLinksManager
      initialLinks={links.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        description: l.description,
        openMode: l.openMode,
      }))}
    />
  );
}
