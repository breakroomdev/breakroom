"use client";

import * as React from "react";
import Link from "next/link";
import { Search, BookOpen, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkspace } from "@/components/workspace-context";
import { relativeTime } from "@/lib/utils";

interface KbArticleSummary {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  updatedAt: number;
}

export function KbBrowser({ initialArticles }: { initialArticles: KbArticleSummary[] }) {
  const { basePath, workspace } = useWorkspace();
  const [q, setQ] = React.useState("");
  const [articles, setArticles] = React.useState(initialArticles);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const url = q ? `/api/workspaces/${workspace.slug}/kb?q=${encodeURIComponent(q)}` : `/api/workspaces/${workspace.slug}/kb`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        setArticles(data.articles.map((a: { id: string; title: string; slug: string; category: string | null; updatedAt: string }) => ({ ...a, updatedAt: new Date(a.updatedAt).getTime() })));
      } finally {
        setLoading(false);
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

      {articles.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title={q ? "No articles match your search" : "No articles yet"}
          description={q ? undefined : "Ask an admin to add your team's first doc."}
        />
      ) : (
        <div className={loading ? "space-y-2 opacity-60 transition-opacity" : "space-y-2 transition-opacity"}>
          {articles.map((a) => (
            <Link key={a.id} href={`${basePath}/kb/${a.slug}`}>
              <Card className="transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground" suppressHydrationWarning>
                      {a.category ? `${a.category} · ` : ""}Updated {relativeTime(new Date(a.updatedAt))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
