import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { listFeed } from "@/lib/services/posts";
import { FilteredPostList } from "@/components/feed/filtered-post-list";

export const metadata = { title: "Polls" };

export default async function PollsPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const { posts, nextCursor } = await listFeed(membership.workspace.id, user.id, null, "poll");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Polls</h1>
        <p className="text-muted-foreground">Every poll created in {membership.workspace.name}, old and new.</p>
      </div>
      <FilteredPostList
        type="poll"
        initialPosts={posts}
        initialCursor={nextCursor}
        emptyIcon="📊"
        emptyTitle="No polls yet"
        emptyDescription="Create a poll from the feed to get quick input from your team."
      />
    </div>
  );
}
