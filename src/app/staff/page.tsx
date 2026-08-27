import { listWorkspacesForStaff } from "@/lib/services/staff";
import { StaffWorkspacesManager } from "@/components/staff/staff-workspaces-manager";

export const metadata = { title: "Workspaces · Staff" };

export default async function StaffWorkspacesPage() {
  const workspaces = await listWorkspacesForStaff();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Workspaces</h1>
        <p className="text-muted-foreground">Every workspace on this instance — {workspaces.length} total.</p>
      </div>
      <StaffWorkspacesManager
        initialWorkspaces={workspaces.map((w) => ({
          id: w.id,
          name: w.name,
          slug: w.slug,
          logoUrl: w.logoUrl,
          verified: Boolean(w.verifiedAt),
          createdAt: w.createdAt.toISOString(),
          ownerName: w.ownerName,
          ownerEmail: w.ownerEmail,
          memberCount: Number(w.memberCount),
        }))}
      />
    </div>
  );
}
