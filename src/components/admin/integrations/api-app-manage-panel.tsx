"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { useWorkspace } from "@/components/workspace-context";
import { relativeTime } from "@/lib/utils";
import type { IntegrationTypeDef } from "@/lib/integrations/registry";
import type { IntegrationRow } from "@/components/admin/integrations-manager";

export function ApiAppManagePanel({
  integration,
  typeDef,
  onOpenChange,
  onChanged,
  onDisconnected,
}: {
  integration: IntegrationRow | null;
  typeDef: IntegrationTypeDef;
  onOpenChange: (open: boolean) => void;
  onChanged: (row: IntegrationRow) => void;
  onDisconnected: (id: string) => void;
}) {
  const { workspace } = useWorkspace();
  const [toggling, setToggling] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);
  const [newSecret, setNewSecret] = React.useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = React.useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  if (!integration) return null;

  async function toggleEnabled(enabled: boolean) {
    setToggling(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}/integrations/${integration!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't update this API app.");
        return;
      }
      onChanged(data.integration);
    } finally {
      setToggling(false);
    }
  }

  async function regenerateSecret() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}/integrations/${integration!.id}/regenerate-secret`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't regenerate the key.");
        return;
      }
      setNewSecret(data.secret);
      setConfirmRegenerate(false);
      toast.success("Key regenerated — the old one no longer works.");
    } finally {
      setRegenerating(false);
    }
  }

  async function disconnect() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}/integrations/${integration!.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete this API app.");
        return;
      }
      toast.success(`${integration!.name} deleted`);
      onDisconnected(integration!.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={!!integration} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <typeDef.icon className="h-5 w-5 text-primary" /> {integration.name}
            </DialogTitle>
            <DialogDescription>{(integration.config.description as string | undefined) || "API app credentials for the Breakroom API."}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Enabled</p>
                <p className="text-xs text-muted-foreground">Turn off to reject requests from this key without deleting it.</p>
              </div>
              <Switch checked={integration.enabled} onCheckedChange={toggleEnabled} disabled={toggling} />
            </label>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-border p-3 text-center">
              <div>
                <p className="font-display text-lg font-bold">{integration.messageCount}</p>
                <p className="text-xs text-muted-foreground">Requests</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{integration.lastActivityAt ? relativeTime(new Date(integration.lastActivityAt)) : "Never"}</p>
                <p className="text-xs text-muted-foreground">Last used</p>
              </div>
              <div>
                <Badge variant={integration.status === "connected" ? "success" : integration.status === "error" ? "destructive" : "secondary"}>
                  {integration.status}
                </Badge>
              </div>
            </div>

            {integration.lastError ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{integration.lastError}</p> : null}

            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">API key</p>
                <Button variant="ghost" size="sm" onClick={() => setConfirmRegenerate(true)}>
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </Button>
              </div>
              {newSecret ? (
                <div className="space-y-2">
                  <p className="text-xs text-warning-strong">New key — shown once. Update anywhere the old key was used; it already stopped working.</p>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2">
                    <code className="truncate text-xs">{newSecret}</code>
                    <CopyButton value={newSecret} label="Copy" />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">•••• {integration.secretLastFour ?? "····"} — never shown again after creation.</p>
              )}
            </div>
          </div>

          <DialogFooter className="!justify-between">
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDisconnect(true)}>
              Delete
            </Button>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmRegenerate}
        onOpenChange={setConfirmRegenerate}
        title="Regenerate this API key?"
        description="The current key stops working immediately. Anything using it will need the new one."
        confirmLabel="Regenerate"
        loading={regenerating}
        onConfirm={regenerateSecret}
      />

      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title={`Delete ${integration.name}?`}
        description="This permanently revokes the key. Anything using it will immediately stop working."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={disconnect}
      />
    </>
  );
}
