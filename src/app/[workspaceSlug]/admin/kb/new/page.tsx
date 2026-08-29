import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { KbArticleEditor } from "@/components/admin/kb-article-editor";

export const metadata = { title: "New article" };

export default async function NewKbArticlePage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");
  requirePermission(membership, "workspace.manage");

  return <KbArticleEditor initial={null} />;
}
