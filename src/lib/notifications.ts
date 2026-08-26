import "server-only";
import { getDb, schema } from "@/lib/db";

interface NotifyInput {
  workspaceId: string;
  userId: string;
  actorId?: string | null;
  type: (typeof schema.notifications.$inferInsert)["type"];
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/** Creates a notification, skipping self-notifications (e.g. reacting to your own post). */
export async function notify(input: NotifyInput) {
  if (input.actorId && input.actorId === input.userId) return;
  const db = await getDb();
  await db.insert(schema.notifications).values({
    workspaceId: input.workspaceId,
    userId: input.userId,
    actorId: input.actorId ?? null,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
    metadata: input.metadata,
  });
}
