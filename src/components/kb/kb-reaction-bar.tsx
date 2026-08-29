"use client";

import * as React from "react";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { KbEngagementState } from "@/components/kb/kb-article-engagement";

const QUICK_EMOJIS = ["👍", "❤️", "🎉", "😂", "😮", "👏"];

export function KbReactionBar({
  articleId,
  state,
  onUpdated,
  onToggleComments,
  commentsOpen,
}: {
  articleId: string;
  state: KbEngagementState;
  onUpdated: (patch: Partial<KbEngagementState>) => void;
  onToggleComments: () => void;
  commentsOpen: boolean;
}) {
  const [pending, setPending] = React.useState(false);

  async function react(emoji: string) {
    if (pending) return;
    setPending(true);

    const wasReacted = state.reactedByMe;
    onUpdated({
      reactedByMe: !wasReacted,
      reactionCount: wasReacted ? Math.max(0, state.reactionCount - 1) : state.reactionCount + 1,
    });

    try {
      const res = await fetch(`/api/kb-articles/${articleId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Couldn't save your reaction.");
      onUpdated({ reactedByMe: wasReacted, reactionCount: state.reactionCount });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-1 border-t border-border pt-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
              state.reactedByMe ? "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span>👍</span>
            {state.reactionCount > 0 ? state.reactionCount : "React"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto gap-1 p-1.5" side="top" align="start">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => react(emoji)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-transform hover:scale-125 hover:bg-muted"
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={onToggleComments}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
          commentsOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <MessageCircle className="h-4 w-4" />
        {state.commentCount > 0 ? state.commentCount : "Comment"}
      </button>
    </div>
  );
}
