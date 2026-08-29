import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Folder } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { listKbCategories, listKbArticles } from "@/lib/services/kb";
import { getWorkspaceBasePath } from "@/lib/workspace-base-path";
import { ArticleList } from "@/components/kb/article-list";
import { slugify } from "@/lib/utils";

export default async function KbCategoryPage({ params }: { params: { workspaceSlug: string; category: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const categories = await listKbCategories(membership.workspace.id);
  const match = categories.find((c) => slugify(c.category ?? "uncategorized") === params.category);
  if (!match) notFound();

  const articles = await listKbArticles(membership.workspace.id, { category: match.category });
  const basePath = getWorkspaceBasePath(params.workspaceSlug);

  return (
    <div>
      <Link href={`${basePath}/kb`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Knowledge Base
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
          <Folder className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{match.category ?? "Uncategorized"}</h1>
          <p className="text-muted-foreground">
            {match.count} article{match.count === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <ArticleList
        articles={articles.map((a) => ({ id: a.id, title: a.title, slug: a.slug, category: a.category, updatedAt: a.updatedAt.getTime() }))}
        buildHref={(slug) => `${basePath}/kb/${slug}`}
        showCategory={false}
      />
    </div>
  );
}
