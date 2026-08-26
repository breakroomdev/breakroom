import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { listTeamMembers } from "@/lib/services/team";
import { TeamGrid } from "@/components/team/team-grid";

export const metadata = { title: "Team" };

export default async function TeamPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const members = await listTeamMembers(membership.workspace.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground">{members.length} people at {membership.workspace.name}.</p>
      </div>
      <TeamGrid members={members} />
    </div>
  );
}
