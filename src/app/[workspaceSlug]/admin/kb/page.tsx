import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { listKbArticles } from "@/lib/services/kb";
import { KbArticlesManager } from "@/components/admin/kb-articles-manager";

export const metadata = { title: "Knowledge Base" };

export default async function AdminKbPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");
  requirePermission(membership, "workspace.manage");

  const articles = await listKbArticles(membership.workspace.id, { includeUnpublished: true });

  return (
    <KbArticlesManager
      initialArticles={articles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        category: a.category,
        status: a.status,
        updatedAt: a.updatedAt.getTime(),
      }))}
    />
  );
}
