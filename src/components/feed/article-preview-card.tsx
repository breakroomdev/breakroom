import Link from "next/link";
import { BookOpen, FileText } from "lucide-react";
import { useWorkspace } from "@/components/workspace-context";
import type { LinkedArticlePreview } from "@/lib/services/posts";

export function ArticlePreviewCard({ article }: { article: LinkedArticlePreview }) {
  const { basePath } = useWorkspace();
  const href = article.kind === "kb" ? `${basePath}/kb/${article.slug}` : `/help/${article.slug}`;

  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
        {article.kind === "kb" ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{article.kind === "kb" ? "Knowledge Base" : "Help Center"}</p>
        <p className="truncate font-medium">{article.title}</p>
        {article.excerpt ? <p className="line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p> : null}
      </div>
    </Link>
  );
}
