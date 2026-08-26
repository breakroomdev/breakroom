import { redirect } from "next/navigation";
import { Users, Rss, BarChart3, CalendarDays, Flag, UserCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { getAdminStats } from "@/lib/services/admin";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const stats = await getAdminStats(membership.workspace.id);

  const cards = [
    { icon: Users, label: "Total members", value: stats.totalMembers },
    { icon: UserCheck, label: "Active members", value: stats.activeMembers },
    { icon: Rss, label: "Posts this week", value: stats.postsThisWeek },
    { icon: BarChart3, label: "Total polls", value: stats.totalPolls },
    { icon: CalendarDays, label: "Upcoming shifts", value: stats.upcomingShifts },
    { icon: Flag, label: "Open reports", value: stats.openReports, alert: stats.openReports > 0 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.alert ? "bg-destructive/10 text-destructive" : "bg-gradient-brand-soft text-primary"}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold leading-none">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
