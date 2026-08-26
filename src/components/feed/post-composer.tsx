"use client";

import * as React from "react";
import { toast } from "sonner";
import { ImagePlus, BarChart3, Megaphone, X, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/feed/image-uploader";
import { useWorkspace, useHasPermission } from "@/components/workspace-context";
import type { UploadedImage } from "@/lib/uploads/client";
import type { FeedPost } from "@/lib/services/posts";
import { cn } from "@/lib/utils";

type PostType = "text" | "image" | "announcement" | "poll";

export function PostComposer({ onPosted }: { onPosted: (post: FeedPost) => void }) {
  const { user } = useWorkspace();
  const canAnnounce = useHasPermission("posts.moderate");

  const [expanded, setExpanded] = React.useState(false);
  const [type, setType] = React.useState<PostType>("text");
  const [content, setContent] = React.useState("");
  const [images, setImages] = React.useState<UploadedImage[]>([]);
  const [pollOptions, setPollOptions] = React.useState(["", ""]);
  const [pollMultiple, setPollMultiple] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  function reset() {
    setExpanded(false);
    setType("text");
    setContent("");
    setImages([]);
    setPollOptions(["", ""]);
    setPollMultiple(false);
  }

  function selectType(next: PostType) {
    setExpanded(true);
    setType(next);
  }

  return (
    <Card className="animate-fade-in-up">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar name={user.displayName} src={user.avatarUrl} />
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder={type === "poll" ? "Ask your team a question…" : "What's happening?"}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (!expanded) setExpanded(true);
              }}
              onFocus={() => setExpanded(true)}
              className="min-h-[44px] resize-none border-none bg-transparent px-0 py-2 text-base shadow-none focus-visible:ring-0"
              maxLength={5000}
            />

            {type === "image" && expanded ? <ImageUploader value={images} onChange={setImages} /> : null}

            {type === "poll" && expanded ? (
              <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      placeholder={`Option ${i + 1}`}
                      maxLength={120}
                      onChange={(e) => setPollOptions((opts) => opts.map((o, idx) => (idx === i ? e.target.value : o)))}
                    />
                    {pollOptions.length > 2 ? (
                      <button
                        type="button"
                        onClick={() => setPollOptions((opts) => opts.filter((_, idx) => idx !== i))}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                        aria-label="Remove option"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
                {pollOptions.length < 10 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPollOptions((opts) => [...opts, ""])}>
                    <Plus className="h-3.5 w-3.5" />
                    Add option
                  </Button>
                ) : null}
                <label className="flex items-center justify-between pt-1 text-sm">
                  <span className="text-muted-foreground">Allow multiple choices</span>
                  <Switch checked={pollMultiple} onCheckedChange={setPollMultiple} />
                </label>
              </div>
            ) : null}

            {expanded ? (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-1">
                  <ComposerTypeButton active={type === "image"} icon={ImagePlus} label="Photo" onClick={() => selectType("image")} />
                  <ComposerTypeButton active={type === "poll"} icon={BarChart3} label="Poll" onClick={() => selectType("poll")} />
                  {canAnnounce ? (
                    <ComposerTypeButton active={type === "announcement"} icon={Megaphone} label="Announcement" onClick={() => selectType("announcement")} />
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={reset}>
                    Cancel
                  </Button>
                  <PostSubmitButton
                    type={type}
                    content={content}
                    images={images}
                    pollOptions={pollOptions}
                    pollMultiple={pollMultiple}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                    onPosted={(post) => {
                      onPosted(post);
                      reset();
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 border-t border-border pt-3">
                <ComposerTypeButton active={false} icon={ImagePlus} label="Photo" onClick={() => selectType("image")} />
                <ComposerTypeButton active={false} icon={BarChart3} label="Poll" onClick={() => selectType("poll")} />
                {canAnnounce ? <ComposerTypeButton active={false} icon={Megaphone} label="Announcement" onClick={() => selectType("announcement")} /> : null}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComposerTypeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function PostSubmitButton({
  type,
  content,
  images,
  pollOptions,
  pollMultiple,
  submitting,
  setSubmitting,
  onPosted,
}: {
  type: PostType;
  content: string;
  images: UploadedImage[];
  pollOptions: string[];
  pollMultiple: boolean;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  onPosted: (post: FeedPost) => void;
}) {
  const { workspace } = useWorkspace();

  async function submit() {
    const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);

    if (type === "poll") {
      if (!content.trim()) return toast.error("Give your poll a question.");
      if (cleanOptions.length < 2) return toast.error("Add at least 2 poll options.");
    } else if (!content.trim() && images.length === 0) {
      return toast.error("Write something or add a photo first.");
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          content: type === "poll" ? content : content || undefined,
          images: images.length ? images.map((i) => ({ url: i.url, publicId: i.publicId, width: i.width, height: i.height })) : undefined,
          commentsEnabled: true,
          poll:
            type === "poll"
              ? { question: content, options: cleanOptions, allowMultiple: pollMultiple }
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't publish your post.");
        return;
      }
      toast.success(type === "poll" ? "Poll published!" : "Posted!");
      onPosted(data.post);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button size="sm" onClick={submit} loading={submitting}>
      {type === "poll" ? "Publish poll" : type === "announcement" ? "Announce" : "Post"}
    </Button>
  );
}
