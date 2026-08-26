"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, relativeTime } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: number;
  actor: { displayName: string; avatarUrl: string | null } | null;
}

export function NotificationsList({ workspaceId, initial }: { workspaceId: string; initial: NotificationItem[] }) {
  const [items, setItems] = React.useState(initial);
  const unreadCount = items.filter((i) => !i.isRead).length;

  async function markAllRead() {
    setItems((p) => p.map((i) => ({ ...i, isRead: true })));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, all: true }),
    });
  }

  async function markRead(id: string) {
    if (items.find((i) => i.id === id)?.isRead) return;
    setItems((p) => p.map((i) => (i.id === id ? { ...i, isRead: true } : i)));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, notificationId: id }),
    });
  }

  if (items.length === 0) {
    return <EmptyState icon="🔔" title="You're all caught up" description="Notifications about your posts, polls and shifts will show up here." />;
  }

  return (
    <div>
      {unreadCount > 0 ? (
        <div className="mb-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.link ?? "#"}
            onClick={() => markRead(item.id)}
            className={cn("flex gap-3 border-b border-border p-4 transition-colors last:border-0 hover:bg-muted", !item.isRead && "bg-primary-50/60 dark:bg-primary-500/10")}
          >
            {item.actor ? (
              <Avatar name={item.actor.displayName} src={item.actor.avatarUrl} />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-base">🔔</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.title}</p>
              {item.body ? <p className="text-sm text-muted-foreground">{item.body}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">{relativeTime(new Date(item.createdAt))}</p>
            </div>
            {!item.isRead ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
