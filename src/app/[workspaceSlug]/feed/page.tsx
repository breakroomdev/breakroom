import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { listFeed } from "@/lib/services/posts";
import { FeedList } from "@/components/feed/feed-list";

export const metadata = { title: "Feed" };

export default async function FeedPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const { posts, nextCursor } = await listFeed(membership.workspace.id, user.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Feed</h1>
        <p className="text-muted-foreground">What's happening across {membership.workspace.name}.</p>
      </div>
      <FeedList initialPosts={posts} initialCursor={nextCursor} />
    </div>
  );
}
