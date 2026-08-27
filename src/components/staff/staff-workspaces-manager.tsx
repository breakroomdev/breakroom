"use client";

import * as React from "react";
import { toast } from "sonner";
import { Search, Trash2, BadgeCheck, Circle, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WorkspaceLogo } from "@/components/brand/workspace-logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { cn, formatDate, slugify } from "@/lib/utils";
import { workspaceDisplayHost, rootDisplayHost } from "@/lib/workspace-url";

interface StaffWorkspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  verified: boolean;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
}

export function StaffWorkspacesManager({ initialWorkspaces }: { initialWorkspaces: StaffWorkspace[] }) {
  const [workspaces, setWorkspaces] = React.useState(initialWorkspaces);
  const [query, setQuery] = React.useState("");
  const [pendingVerify, setPendingVerify] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<StaffWorkspace | null>(null);
  const [editTarget, setEditTarget] = React.useState<StaffWorkspace | null>(null);

  const filtered = workspaces.filter((w) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q) || w.ownerEmail.toLowerCase().includes(q);
  });

  async function toggleVerified(w: StaffWorkspace) {
    setPendingVerify(w.id);
    try {
      const res = await fetch(`/api/staff/workspaces/${w.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !w.verified }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't update this workspace.");
        return;
      }
      setWorkspaces((prev) => prev.map((x) => (x.id === w.id ? { ...x, verified: !x.verified } : x)));
      toast.success(w.verified ? "Verification removed" : "Workspace verified");
    } finally {
      setPendingVerify(null);
    }
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, URL, or owner email…" className="pl-9" />
      </div>

      <div className="space-y-2">
        {filtered.map((w) => (
          <Card key={w.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <WorkspaceLogo name={w.name} logoUrl={w.logoUrl} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-medium">{w.name}</p>
                  {w.verified ? <BadgeCheck className="h-4 w-4 shrink-0 fill-primary text-primary-foreground" /> : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {workspaceDisplayHost(w.slug)} · {w.memberCount} member{w.memberCount === 1 ? "" : "s"} · owner {w.ownerName} ({w.ownerEmail})
                </p>
              </div>
              <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
                Created {formatDate(w.createdAt)}
              </Badge>
              <Button
                variant={w.verified ? "secondary" : "outline"}
                size="sm"
                onClick={() => toggleVerified(w)}
                loading={pendingVerify === w.id}
              >
                {w.verified ? <Circle className="h-3.5 w-3.5" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                {w.verified ? "Unverify" : "Verify"}
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label={`Change domain for ${w.name}`} onClick={() => setEditTarget(w)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label={`Delete ${w.name}`} onClick={() => setDeleteTarget(w)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No workspaces match "{query}".</p> : null}
      </div>

      <DeleteWorkspaceDialog
        workspace={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={(id) => setWorkspaces((prev) => prev.filter((w) => w.id !== id))}
      />

      <EditDomainDialog
        workspace={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onChanged={(id, slug) => setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, slug } : w)))}
      />
    </div>
  );
}

function EditDomainDialog({
  workspace,
  onOpenChange,
  onChanged,
}: {
  workspace: StaffWorkspace | null;
  onOpenChange: (open: boolean) => void;
  onChanged: (id: string, slug: string) => void;
}) {
  const [slug, setSlug] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const rootHost = rootDisplayHost();

  React.useEffect(() => {
    setSlug(workspace?.slug ?? "");
    setError(null);
  }, [workspace]);

  const normalized = slugify(slug);
  const changed = !!workspace && normalized !== workspace.slug;

  async function save() {
    if (!workspace || !normalized || !changed) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Couldn't change the workspace URL.");
        return;
      }
      toast.success("Workspace URL updated");
      onChanged(workspace.id, normalized);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!workspace} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change domain for {workspace?.name}</DialogTitle>
          <DialogDescription>Overrides this workspace's URL directly — its own admins can also do this themselves.</DialogDescription>
        </DialogHeader>
        <Field label="URL" htmlFor="staff-slug">
          <div className="flex items-center rounded-lg border border-input bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring">
            {rootHost ? null : <span className="pl-3 text-sm text-muted-foreground">/</span>}
            <Input
              id="staff-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={cn("h-10 flex-1 border-0 shadow-none focus-visible:ring-0", rootHost ? "pl-3" : "pr-3")}
              maxLength={48}
            />
            {rootHost ? <span className="pr-3 text-sm text-muted-foreground">.{rootHost}</span> : null}
          </div>
        </Field>
        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!normalized || !changed} loading={saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteWorkspaceDialog({
  workspace,
  onOpenChange,
  onDeleted,
}: {
  workspace: StaffWorkspace | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const [confirmText, setConfirmText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    setConfirmText("");
  }, [workspace]);

  async function confirmDelete() {
    if (!workspace || confirmText !== workspace.slug) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/staff/workspaces/${workspace.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.message ?? "Couldn't delete this workspace.");
        return;
      }
      toast.success(`${workspace.name} deleted`);
      onDeleted(workspace.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={!!workspace} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {workspace?.name}?</DialogTitle>
          <DialogDescription>
            This permanently deletes the workspace and everything in it — posts, members, schedules, polls, files. There's no
            undo.
          </DialogDescription>
        </DialogHeader>
        <Field label={`Type "${workspace?.slug}" to confirm`} htmlFor="confirm-slug">
          <Input id="confirm-slug" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
        </Field>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={confirmText !== workspace?.slug} loading={deleting}>
            Delete permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
