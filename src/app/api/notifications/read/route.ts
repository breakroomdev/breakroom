import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

const bodySchema = z.object({
  notificationId: z.string().optional(),
  workspaceId: z.string(),
  all: z.boolean().optional(),
});

export const POST = withErrorHandling(async (req: Request) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const { notificationId, workspaceId, all } = bodySchema.parse(await req.json());
  const db = await getDb();

  if (all) {
    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(and(eq(schema.notifications.userId, user.id), eq(schema.notifications.workspaceId, workspaceId)));
  } else if (notificationId) {
    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(and(eq(schema.notifications.id, notificationId), eq(schema.notifications.userId, user.id)));
  }

  return jsonOk({ success: true });
});
