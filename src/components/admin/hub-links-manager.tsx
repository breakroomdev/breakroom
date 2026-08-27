"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, ExternalLink, LayoutGrid } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HubLinkDialog, type HubLink } from "@/components/admin/hub-link-dialog";
import { useWorkspace } from "@/components/workspace-context";

export function HubLinksManager({ initialLinks }: { initialLinks: HubLink[] }) {
  const { workspace } = useWorkspace();
  const [links, setLinks] = React.useState(initialLinks);
  const [dialogState, setDialogState] = React.useState<{ open: boolean; link: HubLink | null }>({ open: false, link: null });
  const [deleteTarget, setDeleteTarget] = React.useState<HubLink | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function reorder(next: HubLink[]) {
    setLinks(next);
    await fetch(`/api/workspaces/${workspace.slug}/hub-links/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((l) => l.id) }),
    });
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target]!, next[index]!];
    reorder(next);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hub-links/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete link.");
        return;
      }
      setLinks((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      toast.success("Link removed");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Links your team can jump to from the Hub — open inline as an embed, or in a new tab.</p>
        <Button size="sm" onClick={() => setDialogState({ open: true, link: null })}>
          <Plus className="h-4 w-4" /> Add link
        </Button>
      </div>

      {links.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-6 w-6" />}
          title="No Hub links yet"
          description="Add tools, docs, or dashboards your team uses often."
          action={
            <Button onClick={() => setDialogState({ open: true, link: null })}>
              <Plus className="h-4 w-4" /> Add your first link
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {links.map((link, i) => (
            <Card key={link.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${link.title} up`}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === links.length - 1}
                    aria-label={`Move ${link.title} down`}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{link.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{link.url}</p>
                </div>

                <Badge variant="secondary">{link.openMode === "embed" ? "Embed" : "New tab"}</Badge>

                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${link.title}`} onClick={() => setDialogState({ open: true, link })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Delete ${link.title}`} onClick={() => setDeleteTarget(link)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <HubLinkDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
        link={dialogState.link}
        onSaved={(link) => {
          setLinks((prev) => {
            const exists = prev.some((l) => l.id === link.id);
            return exists ? prev.map((l) => (l.id === link.id ? link : l)) : [...prev, link];
          });
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Remove "${deleteTarget?.title}"?`}
        description="It will disappear from the Hub for everyone in this workspace."
        confirmLabel="Remove link"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
