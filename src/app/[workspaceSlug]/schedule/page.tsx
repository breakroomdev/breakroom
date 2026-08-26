import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { listShifts } from "@/lib/services/schedule";
import { listTeamMembers } from "@/lib/services/team";
import { ScheduleView } from "@/components/schedule/schedule-view";
import { monthGrid, toISODate } from "@/lib/calendar";

export const metadata = { title: "Schedule" };

export default async function SchedulePage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const today = toISODate(new Date());
  const grid = monthGrid(today);
  const [shifts, team] = await Promise.all([
    listShifts(membership.workspace.id, grid[0]!, grid[grid.length - 1]!),
    listTeamMembers(membership.workspace.id),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground">Coverage and shifts for {membership.workspace.name}.</p>
      </div>
      <ScheduleView initialShifts={shifts} team={team.map((m) => ({ id: m.id, displayName: m.displayName }))} today={today} />
    </div>
  );
}
