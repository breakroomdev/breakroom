import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { getKbArticleById } from "@/lib/services/kb";
import { KbArticleEditor } from "@/components/admin/kb-article-editor";

export const metadata = { title: "Edit article" };

export default async function EditKbArticlePage({ params }: { params: { workspaceSlug: string; id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");
  requirePermission(membership, "workspace.manage");

  const article = await getKbArticleById(params.id);
  if (!article || article.workspaceId !== membership.workspace.id) notFound();

  return (
    <KbArticleEditor
      initial={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        category: article.category,
        status: article.status,
      }}
    />
  );
}
