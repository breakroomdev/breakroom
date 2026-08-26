"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime, cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  actor: { displayName: string; avatarUrl: string | null } | null;
}

export function NotificationBell({ workspaceId, workspaceSlug, initialUnread }: { workspaceId: string; workspaceSlug: string; initialUnread: number }) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unread, setUnread] = React.useState(initialUnread);
  const [loaded, setLoaded] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const res = await fetch(`/api/notifications?workspaceId=${workspaceId}&limit=10`);
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.notifications);
    setUnread(data.unreadCount);
    setLoaded(true);
  }, [workspaceId]);

  React.useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  React.useEffect(() => {
    if (open && !loaded) refresh();
  }, [open, loaded, refresh]);

  async function markAllRead() {
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, all: true }),
    });
  }

  async function markRead(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isRead: true } : i)));
    setUnread((u) => Math.max(0, u - 1));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, notificationId: id }),
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}>
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pop">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-display text-sm font-semibold">Notifications</p>
          {unread > 0 ? (
            <button onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
              Mark all as read
            </button>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <EmptyState icon="🔔" title="You're all caught up" description="Nothing new right now." className="border-0 px-4 py-10" />
          ) : (
            items.map((item) => (
              <Link
                key={item.id}
                href={item.link ?? `/${workspaceSlug}/notifications`}
                onClick={() => !item.isRead && markRead(item.id)}
                className={cn("flex gap-3 border-b border-border px-4 py-3 text-sm transition-colors last:border-0 hover:bg-muted", !item.isRead && "bg-primary-50/60 dark:bg-primary-500/10")}
              >
                {item.actor ? (
                  <Avatar name={item.actor.displayName} src={item.actor.avatarUrl} size="sm" />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs">🔔</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  {item.body ? <p className="truncate text-muted-foreground">{item.body}</p> : null}
                  <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(new Date(item.createdAt))}</p>
                </div>
                {!item.isRead ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
              </Link>
            ))
          )}
        </div>
        <div className="border-t border-border p-2">
          <Link href={`/${workspaceSlug}/notifications`} className="block rounded-lg px-2 py-2 text-center text-sm font-medium text-primary hover:bg-muted" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
