"use client";

import * as React from "react";
import { Search, X, ChevronDown, Gamepad2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkspace } from "@/components/workspace-context";
import { relativeTime, formatDate } from "@/lib/utils";
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
  const hasFilters = Object.values(appliedFilters).some(Boolean);
  const latestTimestampRef = React.useRef<number | null>(initialMessages[0]?.timestamp ?? null);

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
      <form onSubmit={applyFilters} className="mb-4 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Search messages…" className="pl-9" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Input value={filters.username} onChange={(e) => setFilters((f) => ({ ...f, username: e.target.value }))} placeholder="Username" />
          <Input value={filters.jobId} onChange={(e) => setFilters((f) => ({ ...f, jobId: e.target.value }))} placeholder="Server ID" />
          <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant="secondary" loading={loading}>
            Apply filters
          </Button>
          {hasFilters ? (
            <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          ) : null}
        </div>
      </form>

      {messages.length === 0 ? (
        <EmptyState
          icon={<Gamepad2 className="h-6 w-6" />}
          title={hasFilters ? "No messages match your filters" : "No chat messages yet"}
          description={hasFilters ? undefined : "Once your Roblox script is sending chat, messages will appear here live."}
        />
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {messages.map((m) => (
            <ChatMessageRow key={m.id} message={m} />
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

function ChatMessageRow({ message }: { message: RobloxMessage }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="flex gap-3 p-3">
      <div className="relative shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand-soft text-sm font-bold text-primary">
          {message.displayName.slice(0, 1).toUpperCase()}
        </div>
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
          <button type="button" onClick={() => setExpanded((s) => !s)} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            {formatDate(new Date(message.timestamp), { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
        <p className="mt-0.5 break-words text-sm text-foreground/90">{message.message}</p>
        {expanded ? (
          <p className="mt-1.5 space-x-3 text-xs text-muted-foreground">
            <span>Server: {message.jobId}</span>
            <span>User ID: {message.userId}</span>
            <span>{relativeTime(new Date(message.timestamp))}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
