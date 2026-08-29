import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Folder } from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { listHelpCategories, listHelpArticles } from "@/lib/services/help";
import { ArticleList } from "@/components/kb/article-list";
import { slugify } from "@/lib/utils";

export default async function HelpCategoryPage({ params }: { params: { category: string } }) {
  const categories = await listHelpCategories();
  const match = categories.find((c) => slugify(c.category ?? "uncategorized") === params.category);
  if (!match) notFound();

  const articles = await listHelpArticles({ category: match.category });

  return (
    <div>
      <MarketingNavbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/help" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Help Center
        </Link>

        <div className="mb-8 flex items-center gap-3">
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
          buildHref={(slug) => `/help/${slug}`}
          showCategory={false}
        />
      </main>
      <MarketingFooter />
    </div>
  );
}
