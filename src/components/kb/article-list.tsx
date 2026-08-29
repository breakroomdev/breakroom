import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { relativeTime } from "@/lib/utils";

interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  updatedAt: number;
}

export function ArticleList({
  articles,
  buildHref,
  showCategory = true,
}: {
  articles: ArticleSummary[];
  buildHref: (slug: string) => string;
  showCategory?: boolean;
}) {
  return (
    <div className="space-y-2">
      {articles.map((a) => (
        <Link key={a.id} href={buildHref(a.slug)}>
          <Card className="transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground" suppressHydrationWarning>
                  {showCategory && a.category ? `${a.category} · ` : ""}Updated {relativeTime(new Date(a.updatedAt))}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
