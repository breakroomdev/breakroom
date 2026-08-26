import { and, count, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) return jsonError("workspaceId is required", 400);

  const limit = Math.min(Number(url.searchParams.get("limit") ?? 30), 100);

  const db = await getDb();
  const rows = await db
    .select({ notification: schema.notifications, actor: schema.users })
    .from(schema.notifications)
    .leftJoin(schema.users, eq(schema.users.id, schema.notifications.actorId))
    .where(and(eq(schema.notifications.userId, user.id), eq(schema.notifications.workspaceId, workspaceId)))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit);

  const [{ value: unreadCount = 0 } = {}] = await db
    .select({ value: count() })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, user.id), eq(schema.notifications.workspaceId, workspaceId), eq(schema.notifications.isRead, false)));

  return jsonOk({
    notifications: rows.map((r) => ({
      ...r.notification,
      actor: r.actor ? { id: r.actor.id, displayName: r.actor.displayName, avatarUrl: r.actor.avatarUrl } : null,
    })),
    unreadCount,
  });
});
