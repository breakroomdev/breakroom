import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { listHubLinks } from "@/lib/services/hub";
import { HubGrid } from "@/components/hub/hub-grid";

export const metadata = { title: "Hub" };

export default async function HubPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const links = await listHubLinks(membership.workspace.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Hub</h1>
        <p className="text-muted-foreground">Tools and links your team uses often.</p>
      </div>
      <HubGrid
        links={links.map((l) => ({ id: l.id, title: l.title, url: l.url, description: l.description, openMode: l.openMode }))}
        canManage={membership.role.permissions.includes("workspace.manage")}
        workspaceSlug={params.workspaceSlug}
      />
    </div>
  );
}
