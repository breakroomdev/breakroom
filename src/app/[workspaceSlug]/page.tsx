import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Rss, BarChart3, Users, ArrowRight, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { getUpcomingShifts, getPinnedPosts, getWorkspaceStats } from "@/lib/services/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatTime } from "@/lib/utils";
import { getWorkspaceBasePath } from "@/lib/workspace-base-path";

export const metadata = { title: "Home" };

export default async function DashboardPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const basePath = getWorkspaceBasePath(params.workspaceSlug);

  const [shifts, pinnedPosts, stats] = await Promise.all([
    getUpcomingShifts(membership.workspace.id, user.id),
    getPinnedPosts(membership.workspace.id),
    getWorkspaceStats(membership.workspace.id),
  ]);

  const firstName = user.displayName.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground">Here's what's going on in {membership.workspace.name}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Active members" value={stats.members} />
        <StatCard icon={Rss} label="Posts this week" value={stats.postsThisWeek} />
        <StatCard icon={CalendarDays} label="Upcoming shifts" value={stats.upcomingShifts} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Pinned posts</CardTitle>
            <Link href={`${basePath}/feed`} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Go to feed <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {pinnedPosts.length === 0 ? (
              <EmptyState icon="📌" title="Nothing pinned yet" description="Important announcements will show up here." className="py-10" />
            ) : (
              <div className="space-y-3">
                {pinnedPosts.map(({ post, author }) => (
                  <Link key={post.id} href={`${basePath}/feed`} className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                    <p className="text-sm font-medium">{author.displayName}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Your upcoming shifts</CardTitle>
            <Link href={`${basePath}/schedule`} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Schedule <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {shifts.length === 0 ? (
              <EmptyState icon="🎉" title="No shifts coming up" className="py-10" />
            ) : (
              <div className="space-y-2">
                {shifts.map((shift) => (
                  <div key={shift.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-white" style={{ backgroundColor: shift.color ?? "#3b82f6" }}>
                      <span className="text-[10px] font-medium uppercase leading-none">{formatDate(shift.date, { month: "short" })}</span>
                      <span className="text-sm font-bold leading-none">{new Date(shift.date + "T00:00:00").getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{shift.role ?? "Shift"}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                        {shift.location ? ` · ${shift.location}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink href={`${basePath}/polls`} icon={BarChart3} label="Create a poll" description="Get quick input from the team" />
        <QuickLink href={`${basePath}/team`} icon={Users} label="Team directory" description="See who's who" />
        <QuickLink href={`${basePath}/schedule`} icon={CalendarDays} label="View schedule" description="Check coverage this week" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-xl font-bold leading-none">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, icon: Icon, label, description }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; description: string }) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">{label}</p>
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
