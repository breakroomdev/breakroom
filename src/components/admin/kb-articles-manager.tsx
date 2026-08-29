"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Trash2, BookOpen, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useWorkspace } from "@/components/workspace-context";
import { relativeTime } from "@/lib/utils";

interface KbArticleRow {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  status: "draft" | "published";
  updatedAt: number;
}

export function KbArticlesManager({ initialArticles }: { initialArticles: KbArticleRow[] }) {
  const { basePath } = useWorkspace();
  const [articles, setArticles] = React.useState(initialArticles);
  const [deleteTarget, setDeleteTarget] = React.useState<KbArticleRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/kb-articles/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete this article.");
        return;
      }
      setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      toast.success("Article deleted");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">Docs, SOPs, and onboarding info for your team.</p>
        </div>
        <Button asChild>
          <Link href={`${basePath}/admin/kb/new`}>
            <Plus className="h-4 w-4" /> New article
          </Link>
        </Button>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No articles yet"
          description="Write your first doc — an onboarding guide, a policy, or an SOP your team keeps asking about."
          action={
            <Button asChild>
              <Link href={`${basePath}/admin/kb/new`}>
                <Plus className="h-4 w-4" /> New article
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {articles.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`${basePath}/admin/kb/${a.id}`} className="truncate font-medium hover:underline">
                    {a.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground" suppressHydrationWarning>
                    {a.category ? `${a.category} · ` : ""}Updated {relativeTime(new Date(a.updatedAt))}
                  </p>
                </div>
                {a.status === "draft" ? <Badge variant="secondary">Draft</Badge> : null}
                <Button variant="ghost" size="icon-sm" aria-label={`Delete ${a.title}`} onClick={() => setDeleteTarget(a)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This can't be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
