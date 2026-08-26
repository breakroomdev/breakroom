"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { FeedPost } from "@/lib/services/posts";

export function PollVoteCard({ post, onUpdated }: { post: FeedPost; onUpdated: (post: FeedPost) => void }) {
  const poll = post.poll!;
  const [voting, setVoting] = React.useState<string | null>(null);
  const hasVoted = poll.myVotes.length > 0;
  const expired = poll.expiresAt ? poll.expiresAt < Date.now() : false;
  const showResults = hasVoted || expired;

  async function vote(optionId: string) {
    if (voting || expired) return;
    setVoting(optionId);
    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't record your vote.");
        return;
      }
      onUpdated(data.post);
    } finally {
      setVoting(null);
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
      <div className="space-y-2">
        {poll.options.map((option) => {
          const pct = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
          const mine = poll.myVotes.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              disabled={expired}
              onClick={() => vote(option.id)}
              className={cn(
                "relative w-full overflow-hidden rounded-lg border text-left transition-colors",
                mine ? "border-primary" : "border-border",
                expired ? "cursor-default" : "hover:border-primary/60"
              )}
            >
              {showResults ? (
                <div
                  className="absolute inset-y-0 left-0 bg-primary-100 transition-all duration-500 dark:bg-primary-500/20"
                  style={{ width: `${pct}%` }}
                />
              ) : null}
              <div className="relative flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  {mine ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                  {option.text}
                </span>
                {showResults ? (
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {pct}% · {option.votes}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
        {poll.allowMultiple ? " · Multiple choice" : ""}
        {expired ? " · Poll closed" : poll.expiresAt ? ` · Closes ${formatDate(new Date(poll.expiresAt))}` : ""}
      </p>
    </div>
  );
}
