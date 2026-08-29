import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { getKbArticleBySlug } from "@/lib/services/kb";
import { getWorkspaceBasePath } from "@/lib/workspace-base-path";
import { MarkdownContent } from "@/components/kb/markdown-content";
import { formatDate } from "@/lib/utils";

export default async function KbArticlePage({ params }: { params: { workspaceSlug: string; articleSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const canManage = membership.role.permissions.includes("workspace.manage");
  const article = await getKbArticleBySlug(membership.workspace.id, params.articleSlug, { includeUnpublished: canManage });
  if (!article) notFound();

  const basePath = getWorkspaceBasePath(params.workspaceSlug);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`${basePath}/kb`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Knowledge Base
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{article.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {article.category ? `${article.category} · ` : ""}Updated {formatDate(article.updatedAt, { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <div className="mt-6">
          <MarkdownContent content={article.content} />
        </div>
      </div>
    </div>
  );
}
