"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWorkspace, useHasPermission } from "@/components/workspace-context";
import { relativeTime } from "@/lib/utils";

interface KbComment {
  id: string;
  content: string;
  createdAt: number;
  author: { id: string; displayName: string; username: string; avatarUrl: string | null };
}

export function KbCommentSection({ articleId, onCommentCountChange }: { articleId: string; onCommentCountChange: (delta: number) => void }) {
  const { user } = useWorkspace();
  const canModerate = useHasPermission("comments.moderate");
  const [comments, setComments] = React.useState<KbComment[] | null>(null);
  const [value, setValue] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/kb-articles/${articleId}/comments`)
      .then((r) => r.json())
      .then((data) => !cancelled && setComments(data.comments))
      .catch(() => !cancelled && setComments([]));
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/kb-articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't post your comment.");
        return;
      }
      setComments((c) => [...(c ?? []), data.comment]);
      onCommentCountChange(1);
      setValue("");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    setComments((c) => c?.filter((cm) => cm.id !== id) ?? null);
    onCommentCountChange(-1);
    const res = await fetch(`/api/kb-comments/${id}`, { method: "DELETE" });
    if (!res.ok) toast.error("Couldn't delete comment.");
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {comments === null ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="group flex items-start gap-2.5">
            <Avatar name={c.author.displayName} src={c.author.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="w-fit max-w-full rounded-2xl bg-muted px-3 py-2">
                <p className="text-sm font-medium">{c.author.displayName}</p>
                <p className="whitespace-pre-wrap break-words text-sm">{c.content}</p>
              </div>
              <p className="mt-1 px-1 text-xs text-muted-foreground">{relativeTime(new Date(c.createdAt))}</p>
            </div>
            {c.author.id === user.id || canModerate ? (
              <button
                onClick={() => remove(c.id)}
                className="mt-1 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                aria-label="Delete comment"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ))
      )}

      <form onSubmit={submit} className="flex items-center gap-2.5">
        <Avatar name={user.displayName} src={user.avatarUrl} size="sm" />
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Write a comment…" maxLength={2000} className="rounded-full" />
        <Button type="submit" size="sm" variant="ghost" disabled={!value.trim()} loading={submitting}>
          Send
        </Button>
      </form>
    </div>
  );
}
