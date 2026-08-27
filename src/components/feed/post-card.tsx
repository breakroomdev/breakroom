"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { MoreHorizontal, Pin, Pencil, Trash2, Flag, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ReactionBar } from "@/components/feed/reaction-bar";
import { PollVoteCard } from "@/components/feed/poll-vote-card";
import { CommentSection } from "@/components/feed/comment-section";
import { ReportDialog } from "@/components/feed/report-dialog";
import { useWorkspace, useHasPermission } from "@/components/workspace-context";
import { relativeTime, cn } from "@/lib/utils";
import type { FeedPost } from "@/lib/services/posts";

export function PostCard({ post, onChange, onRemove }: { post: FeedPost; onChange: (post: FeedPost) => void; onRemove: () => void }) {
  const { user } = useWorkspace();
  const canModerate = useHasPermission("posts.moderate");
  const isAuthor = post.author.id === user.id;

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(post.content ?? "");
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  function patch(update: Partial<FeedPost>) {
    onChange({ ...post, ...update });
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't save changes.");
        return;
      }
      onChange(data.post);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function togglePin() {
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !post.isPinned }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error?.message ?? "Couldn't update post.");
      return;
    }
    onChange(data.post);
    toast.success(post.isPinned ? "Post unpinned" : "Post pinned to top of feed");
  }

  async function confirmDeletePost() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete post.");
        return;
      }
      toast.success("Post deleted");
      onRemove();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <Card className={cn("animate-fade-in-up", post.isPinned && "border-primary/30 ring-1 ring-primary/10")}>
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar name={post.author.displayName} src={post.author.avatarUrl} />
            <div>
              <p className="flex items-center gap-1.5 font-medium leading-tight">
                {post.author.displayName}
                {post.type === "announcement" ? (
                  <Badge variant="accent">
                    <Megaphone className="h-3 w-3" /> Announcement
                  </Badge>
                ) : null}
                {post.isPinned ? (
                  <Badge variant="secondary">
                    <Pin className="h-3 w-3" /> Pinned
                  </Badge>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {post.author.jobTitle ? `${post.author.jobTitle} · ` : ""}
                {relativeTime(post.createdAt)}
                {post.editedAt ? " · Edited" : ""}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Post options">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthor ? (
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" /> Edit post
                </DropdownMenuItem>
              ) : null}
              {canModerate ? (
                <DropdownMenuItem onClick={togglePin}>
                  <Pin className="h-4 w-4" /> {post.isPinned ? "Unpin" : "Pin to top"}
                </DropdownMenuItem>
              ) : null}
              {(isAuthor || canModerate) && <DropdownMenuSeparator />}
              {isAuthor || canModerate ? (
                <DropdownMenuItem destructive onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4" /> Delete post
                </DropdownMenuItem>
              ) : null}
              {!isAuthor ? (
                <DropdownMenuItem onClick={() => setReportOpen(true)}>
                  <Flag className="h-4 w-4" /> Report post
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={5000} className="min-h-[100px]" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setDraft(post.content ?? ""); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} loading={saving}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          post.content && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{post.content}</p>
        )}

        {post.images.length > 0 ? <PostImageGrid images={post.images} authorName={post.author.displayName} /> : null}

        {post.type === "poll" && post.poll ? <PollVoteCard post={post} onUpdated={onChange} /> : null}

        <ReactionBar post={post} onUpdated={patch} onToggleComments={() => setCommentsOpen((o) => !o)} commentsOpen={commentsOpen} />

        {commentsOpen && post.commentsEnabled ? (
          <CommentSection postId={post.id} onCommentCountChange={(delta) => patch({ commentCount: Math.max(0, post.commentCount + delta) })} />
        ) : null}
      </CardContent>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this post?"
        description="This can't be undone. Comments and reactions will also be removed."
        confirmLabel="Delete post"
        loading={deleting}
        onConfirm={confirmDeletePost}
      />
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} targetType="post" targetId={post.id} />
    </Card>
  );
}

function PostImageGrid({ images, authorName }: { images: FeedPost["images"]; authorName: string }) {
  const count = images.length;
  return (
    <div
      className={cn(
        "grid gap-1.5 overflow-hidden rounded-xl",
        count === 1 && "grid-cols-1",
        count === 2 && "grid-cols-2",
        count >= 3 && "grid-cols-2"
      )}
    >
      {images.slice(0, 4).map((img, i) => (
        <div key={img.id} className={cn("relative overflow-hidden bg-muted", count === 1 ? "aspect-video" : "aspect-square", count === 3 && i === 0 && "row-span-2 aspect-auto")}>
          <Image
            src={img.url}
            alt={count > 1 ? `Photo ${i + 1} of ${count} from ${authorName}'s post` : `Photo from ${authorName}'s post`}
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
          {count > 4 && i === 3 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 font-display text-lg font-semibold text-white">+{count - 4}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
