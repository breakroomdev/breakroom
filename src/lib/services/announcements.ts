import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

interface CreateAnnouncementInput {
  title: string;
  body?: string;
  link?: string;
  sentBy: string;
}

/** Broadcasts an announcement to every member of every workspace, and logs it to history. */
export async function createAnnouncement(input: CreateAnnouncementInput) {
  const db = await getDb();

  const members = await db
    .select({ workspaceId: schema.workspaceMembers.workspaceId, userId: schema.workspaceMembers.userId })
    .from(schema.workspaceMembers)
    .where(eq(schema.workspaceMembers.status, "active"));

  if (members.length > 0) {
    await db.insert(schema.notifications).values(
      members.map((m) => ({
        workspaceId: m.workspaceId,
        userId: m.userId,
        actorId: null,
        type: "announcement" as const,
        title: input.title,
        body: input.body,
        link: input.link,
      }))
    );
  }

  const [announcement] = await db
    .insert(schema.announcements)
    .values({
      title: input.title,
      body: input.body,
      link: input.link,
      recipientCount: members.length,
      sentBy: input.sentBy,
    })
    .returning();

  return announcement;
}

export async function listAnnouncements() {
  const db = await getDb();
  return db
    .select({
      id: schema.announcements.id,
      title: schema.announcements.title,
      body: schema.announcements.body,
      link: schema.announcements.link,
      recipientCount: schema.announcements.recipientCount,
      createdAt: schema.announcements.createdAt,
      sentByName: schema.users.displayName,
    })
    .from(schema.announcements)
    .innerJoin(schema.users, eq(schema.users.id, schema.announcements.sentBy))
    .orderBy(desc(schema.announcements.createdAt))
    .limit(50);
}
