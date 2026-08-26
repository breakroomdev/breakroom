import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { todayISO } from "@/lib/utils";

export async function getAdminStats(workspaceId: string) {
  const db = await getDb();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [[totalMembers], [activeMembers], [postsThisWeek], [totalPolls], [upcomingShifts], [openReports]] = await Promise.all([
    db.select({ value: count() }).from(schema.workspaceMembers).where(eq(schema.workspaceMembers.workspaceId, workspaceId)),
    db.select({ value: count() }).from(schema.workspaceMembers).where(and(eq(schema.workspaceMembers.workspaceId, workspaceId), eq(schema.workspaceMembers.status, "active"))),
    db.select({ value: count() }).from(schema.posts).where(and(eq(schema.posts.workspaceId, workspaceId), gte(schema.posts.createdAt, weekAgo))),
    db
      .select({ value: count() })
      .from(schema.polls)
      .innerJoin(schema.posts, eq(schema.posts.id, schema.polls.postId))
      .where(eq(schema.posts.workspaceId, workspaceId)),
    db.select({ value: count() }).from(schema.shifts).where(and(eq(schema.shifts.workspaceId, workspaceId), gte(schema.shifts.date, todayISO()))),
    db.select({ value: count() }).from(schema.reports).where(and(eq(schema.reports.workspaceId, workspaceId), eq(schema.reports.status, "open"))),
  ]);

  return {
    totalMembers: totalMembers?.value ?? 0,
    activeMembers: activeMembers?.value ?? 0,
    postsThisWeek: postsThisWeek?.value ?? 0,
    totalPolls: totalPolls?.value ?? 0,
    upcomingShifts: upcomingShifts?.value ?? 0,
    openReports: openReports?.value ?? 0,
  };
}
