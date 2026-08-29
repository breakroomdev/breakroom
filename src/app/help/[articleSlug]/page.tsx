import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { getHelpArticleBySlug } from "@/lib/services/help";
import { MarkdownContent } from "@/components/kb/markdown-content";
import { formatDate } from "@/lib/utils";

export default async function HelpArticlePage({ params }: { params: { articleSlug: string } }) {
  const article = await getHelpArticleBySlug(params.articleSlug);
  if (!article) notFound();

  return (
    <div>
      <MarketingNavbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/help" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Help Center
        </Link>

        <h1 className="font-display text-3xl font-bold tracking-tight">{article.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {article.category ? `${article.category} · ` : ""}Updated {formatDate(article.updatedAt, { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <div className="mt-8">
          <MarkdownContent content={article.content} />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
