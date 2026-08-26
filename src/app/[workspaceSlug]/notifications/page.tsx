import { redirect } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { NotificationsList } from "@/components/notifications/notifications-list";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const db = await getDb();
  const rows = await db
    .select({ notification: schema.notifications, actor: schema.users })
    .from(schema.notifications)
    .leftJoin(schema.users, eq(schema.users.id, schema.notifications.actorId))
    .where(and(eq(schema.notifications.userId, user.id), eq(schema.notifications.workspaceId, membership.workspace.id)))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(50);

  const notifications = rows.map((r) => ({
    id: r.notification.id,
    title: r.notification.title,
    body: r.notification.body,
    link: r.notification.link,
    isRead: r.notification.isRead,
    createdAt: r.notification.createdAt.getTime(),
    actor: r.actor ? { displayName: r.actor.displayName, avatarUrl: r.actor.avatarUrl } : null,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Stay on top of what's happening with your posts, polls and shifts.</p>
      </div>
      <NotificationsList workspaceId={membership.workspace.id} initial={notifications} />
    </div>
  );
}
