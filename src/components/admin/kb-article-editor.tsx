"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MarkdownContent } from "@/components/kb/markdown-content";
import { useWorkspace } from "@/components/workspace-context";
import { slugify } from "@/lib/utils";

export interface KbArticleInitial {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  status: "draft" | "published";
}

export function KbArticleEditor({ initial }: { initial: KbArticleInitial | null }) {
  const router = useRouter();
  const { basePath, workspace } = useWorkspace();
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(!!initial);
  const [category, setCategory] = React.useState(initial?.category ?? "");
  const [content, setContent] = React.useState(initial?.content ?? "");
  const [published, setPublished] = React.useState(initial?.status !== "draft");
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function updateTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = { title, slug, content, category: category || null, status: published ? "published" : "draft" };
      const res = initial
        ? await fetch(`/api/kb-articles/${initial.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch(`/api/workspaces/${workspace.slug}/kb`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Couldn't save this article.");
        return;
      }
      toast.success(initial ? "Article updated" : "Article created");
      router.push(`${basePath}/admin/kb`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initial) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/kb-articles/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete this article.");
        return;
      }
      toast.success("Article deleted");
      router.push(`${basePath}/admin/kb`);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{initial ? "Edit article" : "New article"}</h1>
        <p className="text-muted-foreground">{initial ? "Update this knowledge base article." : "Write a new doc for your team."}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Title, URL, and category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title" htmlFor="kb-title">
            <Input id="kb-title" value={title} onChange={(e) => updateTitle(e.target.value)} maxLength={120} />
          </Field>
          <Field label="URL" htmlFor="kb-slug" hint={`${basePath}/kb/${slug || "…"}`}>
            <Input
              id="kb-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              maxLength={48}
            />
          </Field>
          <Field label="Category" htmlFor="kb-category" hint="Optional">
            <Input id="kb-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Onboarding" maxLength={60} />
          </Field>
          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Published</p>
              <p className="text-xs text-muted-foreground">Drafts are only visible here in the admin list.</p>
            </div>
            <Switch checked={published} onCheckedChange={setPublished} />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>Markdown supported — headings, lists, links, bold/italic, code blocks. Paste a YouTube link on its own line to embed the video.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="write">
            <TabsList>
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="write">
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={50_000} className="min-h-[360px] font-mono text-sm" />
            </TabsContent>
            <TabsContent value="preview">
              <div className="min-h-[360px] rounded-lg border border-border p-4">
                {content.trim() ? <MarkdownContent content={content} /> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <div className="flex items-center justify-between">
        {initial ? (
          <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
            Delete article
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={save} loading={saving} disabled={!title.trim() || !slug.trim()}>
          {initial ? "Save changes" : "Create article"}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${initial?.title}"?`}
        description="This can't be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={remove}
      />
    </div>
  );
}
