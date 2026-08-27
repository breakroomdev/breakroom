"use client";

import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/workspace-context";

export interface HubLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  openMode: "embed" | "new_tab";
}

interface HubLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: HubLink | null;
  onSaved: (link: HubLink) => void;
}

export function HubLinkDialog({ open, onOpenChange, link, onSaved }: HubLinkDialogProps) {
  const { workspace } = useWorkspace();
  const [title, setTitle] = React.useState(link?.title ?? "");
  const [url, setUrl] = React.useState(link?.url ?? "");
  const [description, setDescription] = React.useState(link?.description ?? "");
  const [openMode, setOpenMode] = React.useState<"embed" | "new_tab">(link?.openMode ?? "new_tab");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTitle(link?.title ?? "");
      setUrl(link?.url ?? "");
      setDescription(link?.description ?? "");
      setOpenMode(link?.openMode ?? "new_tab");
      setError(null);
    }
  }, [open, link]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = { title, url, description: description || null, openMode };
      const res = link
        ? await fetch(`/api/hub-links/${link.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch(`/api/workspaces/${workspace.slug}/hub-links`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Couldn't save this link.");
        return;
      }
      onSaved(data.link);
      toast.success(link ? "Link updated" : "Link added");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{link ? "Edit link" : "Add a Hub link"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Title" htmlFor="hub-title">
            <Input id="hub-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Company wiki" maxLength={80} />
          </Field>
          <Field label="URL" htmlFor="hub-url">
            <Input id="hub-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://wiki.example.com" />
          </Field>
          <Field label="Description" htmlFor="hub-description" hint="Optional">
            <Textarea id="hub-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} className="min-h-[70px]" />
          </Field>

          <Field label="When clicked">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOpenMode("new_tab")}
                className={cn("rounded-lg border p-3 text-left text-sm transition-colors", openMode === "new_tab" ? "border-primary bg-primary-50 dark:bg-primary-500/10" : "border-border hover:bg-muted")}
              >
                <p className="font-medium">Open in new tab</p>
                <p className="text-xs text-muted-foreground">Leaves Breakroom, opens a new browser tab.</p>
              </button>
              <button
                type="button"
                onClick={() => setOpenMode("embed")}
                className={cn("rounded-lg border p-3 text-left text-sm transition-colors", openMode === "embed" ? "border-primary bg-primary-50 dark:bg-primary-500/10" : "border-border hover:bg-muted")}
              >
                <p className="font-medium">Embed on the page</p>
                <p className="text-xs text-muted-foreground">Shows inline. Some sites block this — new tab is the safer default.</p>
              </button>
            </div>
          </Field>

          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!title.trim() || !url.trim()}>
            {link ? "Save changes" : "Add link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
