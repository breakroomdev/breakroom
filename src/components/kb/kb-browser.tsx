"use client";

import * as React from "react";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkspace } from "@/components/workspace-context";
import { CategoryGrid } from "@/components/kb/category-grid";
import { ArticleList } from "@/components/kb/article-list";

interface KbArticleSummary {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  updatedAt: number;
}

interface KbCategorySummary {
  category: string | null;
  count: number;
}

export function KbBrowser({ initialCategories }: { initialCategories: KbCategorySummary[] }) {
  const { basePath, workspace } = useWorkspace();
  const [q, setQ] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<KbArticleSummary[] | null>(null);
  const [searching, setSearching] = React.useState(false);

  React.useEffect(() => {
    if (!q) {
      setSearchResults(null);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/workspaces/${workspace.slug}/kb?q=${encodeURIComponent(q)}`);
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
  }, [q, workspace.slug]);

  return (
    <div>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles…" className="pl-9" />
      </div>

      {q ? (
        searchResults === null || searching ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Searching…</p>
        ) : searchResults.length === 0 ? (
          <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No articles match your search" />
        ) : (
          <ArticleList articles={searchResults} buildHref={(slug) => `${basePath}/kb/${slug}`} />
        )
      ) : initialCategories.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No articles yet" description="Ask an admin to add your team's first doc." />
      ) : (
        <CategoryGrid categories={initialCategories} baseHref={`${basePath}/kb/category`} />
      )}
    </div>
  );
}
