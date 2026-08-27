"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { useWorkspace } from "@/components/workspace-context";
import { WORKSPACE_THEMES, THEME_META, type WorkspaceTheme } from "@/lib/theme";
import { cn, slugify } from "@/lib/utils";

interface Initial {
  name: string;
  description: string | null;
  logoUrl: string | null;
  theme: string;
}

export function WorkspaceSettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const [form, setForm] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  async function save(patch?: Partial<Initial>) {
    const payload = { ...form, ...patch };
    setForm(payload);
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        toast.error("Couldn't save workspace settings.");
        return;
      }
      toast.success("Workspace updated");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic information about your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvatarUpload name={form.name} url={form.logoUrl} onChange={(url) => save({ logoUrl: url })} />

          <Field label="Workspace name" htmlFor="name">
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Description" htmlFor="description">
            <Textarea id="description" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} maxLength={500} className="min-h-[80px]" />
          </Field>
          <div className="flex justify-end">
            <Button onClick={() => save()} loading={saving}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <WorkspaceSlugForm currentSlug={workspace.slug} />

      <Card>
        <CardHeader>
          <CardTitle>Workspace theme</CardTitle>
          <CardDescription>The default look for everyone in this workspace. Members can override it in their personal settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {WORKSPACE_THEMES.map((t) => (
              <button
                key={t}
                onClick={() => save({ theme: t })}
                className={cn("flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors", form.theme === t ? "border-primary" : "border-border hover:bg-muted")}
              >
                <span className="h-5 w-5 rounded-full" style={{ backgroundColor: THEME_META[t as WorkspaceTheme].swatch }} />
                {THEME_META[t as WorkspaceTheme].label.replace("Breakroom ", "")}
                {form.theme === t ? <Check className="ml-auto h-3.5 w-3.5 text-primary" /> : null}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkspaceSlugForm({ currentSlug }: { currentSlug: string }) {
  const router = useRouter();
  const [slug, setSlug] = React.useState(currentSlug);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const normalized = slugify(slug);
  const changed = normalized !== currentSlug;

  async function save() {
    if (!normalized || !changed) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${currentSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Couldn't update the workspace URL.");
        return;
      }
      toast.success("Workspace URL updated");
      router.push(`/${normalized}/admin/workspace`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace URL</CardTitle>
        <CardDescription>This is the address your team uses to sign in and access this workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="URL" htmlFor="slug">
          <div className="flex items-center rounded-lg border border-input bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <span className="pl-3 text-sm text-muted-foreground">breakroom.app/</span>
            <input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="h-10 flex-1 bg-transparent pr-3 text-sm outline-none"
              maxLength={48}
            />
          </div>
        </Field>

        {changed ? (
          <p className="flex items-start gap-2 rounded-lg bg-warning/15 px-3 py-2 text-sm text-warning-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This will change your workspace address to <strong>breakroom.app/{normalized || "…"}</strong>. Any
              bookmarked or shared links to breakroom.app/{currentSlug} will stop working.
            </span>
          </p>
        ) : null}

        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

        <div className="flex justify-end">
          <Button onClick={save} disabled={!changed || !normalized} loading={saving}>
            Update URL
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
