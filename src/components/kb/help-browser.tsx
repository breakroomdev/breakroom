"use client";

import * as React from "react";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryGrid } from "@/components/kb/category-grid";
import { ArticleList } from "@/components/kb/article-list";

interface HelpArticleSummary {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  updatedAt: number;
}

interface HelpCategorySummary {
  category: string | null;
  count: number;
}

export function HelpBrowser({ initialCategories }: { initialCategories: HelpCategorySummary[] }) {
  const [q, setQ] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<HelpArticleSummary[] | null>(null);
  const [searching, setSearching] = React.useState(false);

  React.useEffect(() => {
    if (!q) {
      setSearchResults(null);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/help?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json();
        setSearchResults(
          data.articles.map((a: { id: string; title: string; slug: string; category: string | null; updatedAt: string }) => ({
            ...a,
            updatedAt: new Date(a.updatedAt).getTime(),
          }))
        );
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  return (
    <div>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help articles…" className="pl-9" />
      </div>

      {q ? (
        searchResults === null || searching ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Searching…</p>
        ) : searchResults.length === 0 ? (
          <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No articles match your search" />
        ) : (
          <ArticleList articles={searchResults} buildHref={(slug) => `/help/${slug}`} />
        )
      ) : initialCategories.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No help articles yet" />
      ) : (
        <CategoryGrid categories={initialCategories} baseHref="/help/category" />
      )}
    </div>
  );
}
