import "server-only";
import { and, asc, count, eq, gte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { todayISO } from "@/lib/utils";

export async function getUpcomingShifts(workspaceId: string, userId: string, limit = 5) {
  const db = await getDb();
  return db
    .select()
    .from(schema.shifts)
    .where(and(eq(schema.shifts.workspaceId, workspaceId), eq(schema.shifts.userId, userId), gte(schema.shifts.date, todayISO())))
    .orderBy(asc(schema.shifts.date), asc(schema.shifts.startTime))
    .limit(limit);
}

export async function getPinnedPosts(workspaceId: string, limit = 3) {
  const db = await getDb();
  return db
    .select({ post: schema.posts, author: schema.users })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.users.id, schema.posts.authorId))
    .where(and(eq(schema.posts.workspaceId, workspaceId), eq(schema.posts.isPinned, true)))
    .limit(limit);
}

export async function getWorkspaceStats(workspaceId: string) {
  const db = await getDb();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [[members], [postsThisWeek], [upcomingShiftsCount]] = await Promise.all([
    db.select({ value: count() }).from(schema.workspaceMembers).where(and(eq(schema.workspaceMembers.workspaceId, workspaceId), eq(schema.workspaceMembers.status, "active"))),
    db.select({ value: count() }).from(schema.posts).where(and(eq(schema.posts.workspaceId, workspaceId), gte(schema.posts.createdAt, weekAgo))),
    db.select({ value: count() }).from(schema.shifts).where(and(eq(schema.shifts.workspaceId, workspaceId), gte(schema.shifts.date, todayISO()))),
  ]);

  return {
    members: members?.value ?? 0,
    postsThisWeek: postsThisWeek?.value ?? 0,
    upcomingShifts: upcomingShiftsCount?.value ?? 0,
  };
}
