import { redirect } from "next/navigation";
import { Users, Rss, BarChart3, CalendarDays, Flag, UserCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { getAdminStats } from "@/lib/services/admin";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin overview" };

type Tone = "primary" | "accent" | "warning" | "destructive";

const TONE_STYLES: Record<Tone, string> = {
  primary: "bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300",
  accent: "bg-accent/15 text-accent-foreground",
  warning: "bg-warning/15 text-warning-strong",
  destructive: "bg-destructive/10 text-destructive",
};

export default async function AdminOverviewPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const stats = await getAdminStats(membership.workspace.id);

  const cards: { icon: typeof Users; label: string; value: number; tone: Tone }[] = [
    { icon: Users, label: "Total members", value: stats.totalMembers, tone: "primary" },
    { icon: UserCheck, label: "Active members", value: stats.activeMembers, tone: "accent" },
    { icon: Rss, label: "Posts this week", value: stats.postsThisWeek, tone: "primary" },
    { icon: BarChart3, label: "Total polls", value: stats.totalPolls, tone: "accent" },
    { icon: CalendarDays, label: "Upcoming shifts", value: stats.upcomingShifts, tone: "warning" },
    { icon: Flag, label: "Open reports", value: stats.openReports, tone: stats.openReports > 0 ? "destructive" : "warning" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", TONE_STYLES[c.tone])}>
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
