"use client";

import * as React from "react";
import Image from "next/image";
import { Search, SlidersHorizontal, X, ChevronDown, Gamepad2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkspace } from "@/components/workspace-context";
import { cn, relativeTime, formatDate } from "@/lib/utils";
import { RobloxProfileTrigger } from "@/components/integrations/roblox-profile-panel";

interface RobloxMessage {
  id: string;
  userId: number;
  username: string;
  displayName: string;
  message: string;
  jobId: string;
  timestamp: number;
}

interface Filters {
  q: string;
  username: string;
  jobId: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = { q: "", username: "", jobId: "", from: "", to: "" };

export function RobloxChatViewer({
  integrationId,
  initialMessages,
  initialCursor,
}: {
  integrationId: string;
  initialMessages: RobloxMessage[];
  initialCursor: number | null;
}) {
  const { workspace } = useWorkspace();
  const [messages, setMessages] = React.useState(initialMessages);
  const [cursor, setCursor] = React.useState(initialCursor);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = React.useState(false);
  const [avatars, setAvatars] = React.useState<Record<number, string | null>>({});
  const hasFilters = Object.values(appliedFilters).some(Boolean);
  const latestTimestampRef = React.useRef<number | null>(initialMessages[0]?.timestamp ?? null);
  const fetchedUserIdsRef = React.useRef<Set<number>>(new Set());

  // Real Roblox avatars, fetched once per unique player in view (the profile
  // endpoint caches them server-side, so re-renders never re-hit Roblox's API).
  React.useEffect(() => {
    const toFetch = new Map<number, { username: string; displayName: string }>();
    for (const m of messages) {
      if (!fetchedUserIdsRef.current.has(m.userId)) {
        toFetch.set(m.userId, { username: m.username, displayName: m.displayName });
      }
    }
    if (toFetch.size === 0) return;
    toFetch.forEach((info, userId) => {
      fetchedUserIdsRef.current.add(userId);
      fetch(`/api/roblox/profile/${userId}?username=${encodeURIComponent(info.username)}&displayName=${encodeURIComponent(info.displayName)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.profile) setAvatars((prev) => ({ ...prev, [userId]: data.profile.avatarUrl }));
        })
        .catch(() => {});
    });
  }, [messages]);

  const baseUrl = `/api/workspaces/${workspace.slug}/integrations/${integrationId}/messages`;

  function buildParams(f: Filters, extra?: Record<string, string>) {
    const params = new URLSearchParams();
    if (f.q) params.set("q", f.q);
    if (f.username) params.set("username", f.username);
    if (f.jobId) params.set("jobId", f.jobId);
    if (f.from) params.set("from", new Date(f.from).toISOString());
    if (f.to) params.set("to", new Date(f.to).toISOString());
    if (extra) for (const [k, v] of Object.entries(extra)) params.set(k, v);
    return params;
  }

  async function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}?${buildParams(filters)}`);
      const data = await res.json();
      setMessages(data.messages);
      setCursor(data.nextCursor);
      setAppliedFilters(filters);
      latestTimestampRef.current = data.messages[0]?.timestamp ?? null;
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setLoading(true);
    fetch(`${baseUrl}`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages);
        setCursor(data.nextCursor);
        latestTimestampRef.current = data.messages[0]?.timestamp ?? null;
      })
      .finally(() => setLoading(false));
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`${baseUrl}?${buildParams(appliedFilters, { cursor: String(cursor) })}`);
      const data = await res.json();
      setMessages((prev) => [...prev, ...data.messages]);
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  // Live polling for new messages — only while browsing the unfiltered live log.
  React.useEffect(() => {
    if (hasFilters) return;
    const interval = setInterval(async () => {
      const since = latestTimestampRef.current ?? Date.now();
      const res = await fetch(`${baseUrl}?since=${since}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const fresh = data.messages.filter((m: RobloxMessage) => !existingIds.has(m.id));
          return [...fresh, ...prev];
        });
        latestTimestampRef.current = data.messages[0].timestamp;
      }
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFilters, baseUrl]);

  return (
    <div>
      <form onSubmit={applyFilters} className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Search messages…" className="pl-9" />
          </div>
          <Button
            type="button"
            variant={showFilters || hasFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters((s) => !s)}
            className="shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters ? <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">•</span> : null}
          </Button>
        </div>

        {showFilters ? (
          <div className="mt-2 space-y-3 rounded-xl border border-border bg-muted/30 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Input value={filters.username} onChange={(e) => setFilters((f) => ({ ...f, username: e.target.value }))} placeholder="Username" />
              <Input value={filters.jobId} onChange={(e) => setFilters((f) => ({ ...f, jobId: e.target.value }))} placeholder="Server ID" />
              <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
              <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={loading}>
                Apply filters
              </Button>
              {hasFilters ? (
                <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </form>

      {messages.length === 0 ? (
        <EmptyState
          icon={<Gamepad2 className="h-6 w-6" />}
          title={hasFilters ? "No messages match your filters" : "No chat messages yet"}
          description={hasFilters ? undefined : "Once your Roblox script is sending chat, messages will appear here live."}
        />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {messages.map((m) => (
            <ChatMessageRow key={m.id} message={m} avatarUrl={avatars[m.userId]} />
          ))}
        </div>
      )}

      {cursor && !loadingMore ? (
        <div className="flex justify-center pt-4">
          <Button variant="secondary" onClick={loadMore}>
            Load older messages
          </Button>
        </div>
      ) : null}
      {loadingMore ? <p className="pt-4 text-center text-sm text-muted-foreground">Loading…</p> : null}
    </div>
  );
}

const AVATAR_TONES = [
  "bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300",
  "bg-accent/15 text-accent-foreground",
  "bg-success/15 text-success",
  "bg-warning/15 text-warning-strong",
];

function avatarTone(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function ChatMessageRow({ message, avatarUrl }: { message: RobloxMessage; avatarUrl?: string | null }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className={cn("group flex gap-3 p-3.5 transition-colors hover:bg-muted/40", expanded && "bg-muted/40")}>
      <div className="relative shrink-0">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold", avatarTone(message.username))}>
            {message.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-[#00A2FF] text-white">
          <Gamepad2 className="h-2 w-2" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <RobloxProfileTrigger userId={message.userId} username={message.username} displayName={message.displayName}>
            <button type="button" className="font-medium hover:underline">
              {message.displayName}
            </button>
          </RobloxProfileTrigger>
          <RobloxProfileTrigger userId={message.userId} username={message.username} displayName={message.displayName}>
            <button type="button" className="text-xs text-muted-foreground hover:underline">
              @{message.username}
            </button>
          </RobloxProfileTrigger>
          <button
            type="button"
            onClick={() => setExpanded((s) => !s)}
            className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground data-[expanded=true]:opacity-100"
            data-expanded={expanded}
          >
            {formatDate(new Date(message.timestamp), { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
        <p className="mt-0.5 break-words text-sm leading-relaxed text-foreground/90">{message.message}</p>
        {expanded ? (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-background/60 px-2.5 py-1.5 text-xs text-muted-foreground">
            <span>Server {message.jobId.slice(0, 8)}</span>
            <span>User ID {message.userId}</span>
            <span>{relativeTime(new Date(message.timestamp))}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
