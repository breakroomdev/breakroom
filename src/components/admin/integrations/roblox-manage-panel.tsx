"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RefreshCw, ChevronDown, AlertTriangle } from "lucide-react";
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

const TROUBLESHOOTING = [
  { issue: "No messages arriving", fix: "Make sure the script is in ServerScriptService and the server is actually running (Play or a live server, not just Studio edit mode)." },
  { issue: "HTTP requests disabled", fix: "In Roblox Studio: Game Settings → Security → enable \"Allow HTTP Requests\"." },
  { issue: "Incorrect Universe ID / Place ID", fix: "These must exactly match the experience the script is running in, or Breakroom rejects the message." },
  { issue: "Invalid integration secret", fix: "If you regenerated the secret in Breakroom, the script's old secret stops working immediately — update it." },
  { issue: "Script not installed", fix: "Copy the script from the connect wizard into a Script (not a LocalScript) inside ServerScriptService." },
];

export function RobloxManagePanel({
  integration,
  typeDef,
  basePath,
  onOpenChange,
  onChanged,
  onDisconnected,
}: {
  integration: IntegrationRow | null;
  typeDef: IntegrationTypeDef;
  basePath: string;
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
  const [showTroubleshooting, setShowTroubleshooting] = React.useState(false);

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
        toast.error(data.error?.message ?? "Couldn't update this integration.");
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
        toast.error(data.error?.message ?? "Couldn't regenerate the secret.");
        return;
      }
      setNewSecret(data.secret);
      setConfirmRegenerate(false);
      toast.success("Secret regenerated — the old one no longer works.");
    } finally {
      setRegenerating(false);
    }
  }

  async function disconnect() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}/integrations/${integration!.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't disconnect this integration.");
        return;
      }
      toast.success(`${integration!.name} disconnected`);
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
            <DialogDescription>Universe {integration.config.universeId} · Place {integration.config.placeId}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Enabled</p>
                <p className="text-xs text-muted-foreground">Turn off to stop accepting messages without disconnecting.</p>
              </div>
              <Switch checked={integration.enabled} onCheckedChange={toggleEnabled} disabled={toggling} />
            </label>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-border p-3 text-center">
              <div>
                <p className="font-display text-lg font-bold">{integration.messageCount}</p>
                <p className="text-xs text-muted-foreground">Messages</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{integration.lastActivityAt ? relativeTime(new Date(integration.lastActivityAt)) : "Never"}</p>
                <p className="text-xs text-muted-foreground">Last message</p>
              </div>
              <div>
                <Badge variant={integration.status === "connected" ? "success" : integration.status === "error" ? "destructive" : "secondary"}>
                  {integration.status}
                </Badge>
              </div>
            </div>

            {integration.lastError ? (
              <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {integration.lastError}
              </p>
            ) : null}

            <Button variant="secondary" size="sm" asChild className="w-full">
              <Link href={`${basePath}/integrations/roblox/${integration.id}`}>View chat log</Link>
            </Button>

            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Integration secret</p>
                <Button variant="ghost" size="sm" onClick={() => setConfirmRegenerate(true)}>
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </Button>
              </div>
              {newSecret ? (
                <div className="space-y-1.5">
                  <p className="text-xs text-warning-strong">New secret — shown once. Update your Roblox script now.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-md bg-muted px-2 py-1 text-xs">{newSecret}</code>
                    <CopyButton value={newSecret} />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">•••• {integration.secretLastFour ?? "····"} — never shown again after creation.</p>
              )}
            </div>

            <button type="button" onClick={() => setShowTroubleshooting((s) => !s)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showTroubleshooting ? "rotate-180" : ""}`} />
              Troubleshooting
            </button>
            {showTroubleshooting ? (
              <ul className="space-y-2 rounded-lg border border-border p-3 text-xs text-muted-foreground">
                {TROUBLESHOOTING.map((t) => (
                  <li key={t.issue}>
                    <span className="font-medium text-foreground">{t.issue}.</span> {t.fix}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <DialogFooter className="!justify-between">
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDisconnect(true)}>
              Disconnect
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
        title="Regenerate the integration secret?"
        description="The current secret stops working immediately. You'll need to update the Roblox script with the new one."
        confirmLabel="Regenerate"
        loading={regenerating}
        onConfirm={regenerateSecret}
      />

      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title={`Disconnect ${integration.name}?`}
        description="Roblox will no longer be able to send messages here. Previously logged chat messages are kept."
        confirmLabel="Disconnect"
        loading={deleting}
        onConfirm={disconnect}
      />
    </>
  );
}
