import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { listMedia } from "@/lib/services/media";
import { MediaGallery } from "@/components/media/media-gallery";

export const metadata = { title: "Media" };

export default async function MediaPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const { items, nextCursor } = await listMedia(membership.workspace.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Media</h1>
        <p className="text-muted-foreground">Every photo shared in {membership.workspace.name}.</p>
      </div>
      <MediaGallery initialItems={items} initialCursor={nextCursor} />
    </div>
  );
}
