"use client";

import * as React from "react";
import { toast } from "sonner";
import { Gamepad2, ArrowRight, Loader2, PartyPopper, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useWorkspace } from "@/components/workspace-context";
import { buildRobloxScript } from "@/lib/integrations/roblox-script";
import type { IntegrationRow } from "@/components/admin/integrations-manager";

type Step = "setup" | "install" | "test" | "done";

export function RobloxConnectWizard({
  open,
  onOpenChange,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: (row: IntegrationRow) => void;
}) {
  const { workspace } = useWorkspace();
  const [step, setStep] = React.useState<Step>("setup");
  const [name, setName] = React.useState("Roblox Chat Logger");
  const [universeId, setUniverseId] = React.useState("");
  const [placeId, setPlaceId] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [integrationId, setIntegrationId] = React.useState<string | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);
  const [showScript, setShowScript] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setStep("setup");
      setName("Roblox Chat Logger");
      setUniverseId("");
      setPlaceId("");
      setError(null);
      setIntegrationId(null);
      setSecret(null);
      setShowScript(false);
    }
  }, [open]);

  async function connect() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, universeId, placeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Couldn't connect this integration.");
        return;
      }
      setIntegrationId(data.integration.id);
      setSecret(data.secret);
      setStep("install");
    } finally {
      setSaving(false);
    }
  }

  // This endpoint isn't workspace-scoped in its URL — the secret alone identifies which
  // workspace/integration a message belongs to — so it's always the plain root API URL.
  const cleanApiUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/integrations/roblox/chat`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {step === "setup" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" /> Connect Roblox Chat Logger
              </DialogTitle>
              <DialogDescription>Bring your Roblox experience's in-game chat into Breakroom.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Field label="Name" htmlFor="rbx-name" hint="Shown in Breakroom if you connect more than one experience.">
                <Input id="rbx-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Universe ID" htmlFor="rbx-universe">
                  <Input id="rbx-universe" value={universeId} onChange={(e) => setUniverseId(e.target.value.replace(/\D/g, ""))} placeholder="123456789" inputMode="numeric" />
                </Field>
                <Field label="Place ID" htmlFor="rbx-place">
                  <Input id="rbx-place" value={placeId} onChange={(e) => setPlaceId(e.target.value.replace(/\D/g, ""))} placeholder="987654321" inputMode="numeric" />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                Find these in the Roblox Creator Dashboard, or in Studio under Game Settings → your experience's page shows the
                Universe ID and Place ID in its URL.
              </p>
              {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
              <Button onClick={connect} disabled={!universeId || !placeId || !name.trim()} loading={saving} className="w-full">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : null}

        {step === "install" && integrationId && secret ? (
          <>
            <DialogHeader>
              <DialogTitle>Set up the Roblox side</DialogTitle>
              <DialogDescription>Paste this script into a Script inside ServerScriptService in your Roblox experience.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning-strong">
                This secret is shown <strong>once</strong>. It's already included in the script below — copy the script now.
              </div>

              <RobloxScriptBlock apiUrl={cleanApiUrl} secret={secret} universeId={universeId} placeId={placeId} />

              <button type="button" onClick={() => setShowScript((s) => !s)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showScript ? "rotate-180" : ""}`} />
                {showScript ? "Hide" : "Show"} endpoint & secret individually
              </button>
              {showScript ? (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <code className="truncate text-xs text-muted-foreground">{cleanApiUrl}</code>
                    <CopyButton value={cleanApiUrl} label="Copy URL" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="truncate text-xs text-muted-foreground">{secret}</code>
                    <CopyButton value={secret} label="Copy secret" />
                  </div>
                </div>
              ) : null}

              <Button onClick={() => setStep("test")} className="w-full">
                I've added the script <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : null}

        {step === "test" && integrationId ? (
          <TestStep
            workspaceSlug={workspace.slug}
            integrationId={integrationId}
            onConnected={(row) => {
              onConnected(row);
              setStep("done");
            }}
          />
        ) : null}

        {step === "done" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <PartyPopper className="h-7 w-7" />
            </div>
            <p className="font-display text-lg font-semibold">Roblox is connected!</p>
            <p className="text-sm text-muted-foreground">Chat messages from your experience will now show up in Breakroom.</p>
            <Button onClick={() => onOpenChange(false)} className="mt-2 w-full">
              Done
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RobloxScriptBlock({ apiUrl, secret, universeId, placeId }: { apiUrl: string; secret: string; universeId: string; placeId: string }) {
  const script = React.useMemo(() => buildRobloxScript({ apiUrl, secret, universeId, placeId }), [apiUrl, secret, universeId, placeId]);
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">ServerScriptService/BreakroomChatLogger.lua</p>
        <CopyButton value={script} label="Copy script" />
      </div>
      <pre className="max-h-56 overflow-auto bg-card p-3 text-[11px] leading-relaxed text-foreground/90">
        <code>{script}</code>
      </pre>
    </div>
  );
}

function TestStep({
  workspaceSlug,
  integrationId,
  onConnected,
}: {
  workspaceSlug: string;
  integrationId: string;
  onConnected: (row: IntegrationRow) => void;
}) {
  const [lostIntegration, setLostIntegration] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/integrations/${integrationId}`);
      if (cancelled) return;
      if (res.status === 404) {
        // The integration was disconnected (e.g. from another tab) while this wizard was waiting.
        clearInterval(interval);
        setLostIntegration(true);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (data.integration.messageCount > 0) {
        clearInterval(interval);
        if (!cancelled) {
          toast.success("Roblox is connected!");
          onConnected(data.integration);
        }
      }
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [workspaceSlug, integrationId, onConnected]);

  if (lostIntegration) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>This integration no longer exists</DialogTitle>
          <DialogDescription>It looks like it was disconnected while this wizard was waiting — possibly from another tab.</DialogDescription>
        </DialogHeader>
        <p className="py-4 text-sm text-muted-foreground">Close this and connect again from Admin → Integrations.</p>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Test the connection</DialogTitle>
        <DialogDescription>Send a chat message in your Roblox experience — it should show up here within a few seconds.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium">Waiting for a message from Roblox…</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Make sure the script is running (Play or a live server) and that HTTP requests are enabled for the experience.
        </p>
      </div>
    </>
  );
}
