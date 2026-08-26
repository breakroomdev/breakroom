"use client";

import * as React from "react";
import { PostComposer } from "@/components/feed/post-composer";
import { PostCard } from "@/components/feed/post-card";
import { PostSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/workspace-context";
import type { FeedPost } from "@/lib/services/posts";

export function FeedList({ initialPosts, initialCursor }: { initialPosts: FeedPost[]; initialCursor: number | null }) {
  const { workspace } = useWorkspace();
  const [posts, setPosts] = React.useState(initialPosts);
  const [cursor, setCursor] = React.useState(initialCursor);
  const [loadingMore, setLoadingMore] = React.useState(false);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}/posts?cursor=${cursor}`);
      const data = await res.json();
      setPosts((p) => [...p, ...data.posts]);
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-4">
      <PostComposer onPosted={(post) => setPosts((p) => [post, ...p])} />

      {posts.length === 0 ? (
        <EmptyState
          icon="👀"
          title="Nothing here yet"
          description="Be the first to share something with your team."
        />
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onChange={(updated) => setPosts((p) => p.map((x) => (x.id === updated.id ? updated : x)))}
            onRemove={() => setPosts((p) => p.filter((x) => x.id !== post.id))}
          />
        ))
      )}

      {loadingMore ? <PostSkeleton /> : null}

      {cursor && !loadingMore ? (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={loadMore}>
            Load more posts
          </Button>
        </div>
      ) : null}
    </div>
  );
}
