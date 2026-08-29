"use client";

import * as React from "react";
import { KbReactionBar } from "@/components/kb/kb-reaction-bar";
import { KbCommentSection } from "@/components/kb/kb-comment-section";

export interface KbEngagementState {
  commentCount: number;
  reactionCount: number;
  reactedByMe: boolean;
}

export function KbArticleEngagement({ articleId, initial }: { articleId: string; initial: KbEngagementState }) {
  const [state, setState] = React.useState(initial);
  const [commentsOpen, setCommentsOpen] = React.useState(false);

  function patch(update: Partial<KbEngagementState>) {
    setState((s) => ({ ...s, ...update }));
  }

  return (
    <div className="mt-6 space-y-3">
      <KbReactionBar
        articleId={articleId}
        state={state}
        onUpdated={patch}
        onToggleComments={() => setCommentsOpen((o) => !o)}
        commentsOpen={commentsOpen}
      />
      {commentsOpen ? (
        <KbCommentSection articleId={articleId} onCommentCountChange={(delta) => patch({ commentCount: Math.max(0, state.commentCount + delta) })} />
      ) : null}
    </div>
  );
}
