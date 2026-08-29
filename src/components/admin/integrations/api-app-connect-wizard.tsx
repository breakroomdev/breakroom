"use client";

import * as React from "react";
import { KeyRound, ArrowRight, PartyPopper } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useWorkspace } from "@/components/workspace-context";
import type { IntegrationRow } from "@/components/admin/integrations-manager";

type Step = "setup" | "done";

const ENDPOINTS = [
  { method: "GET", path: "/posts" },
  { method: "POST", path: "/posts" },
  { method: "GET", path: "/shifts?start=&end=" },
  { method: "POST", path: "/shifts" },
  { method: "PATCH", path: "/shifts/:id" },
  { method: "DELETE", path: "/shifts/:id" },
  { method: "GET", path: "/positions" },
  { method: "GET", path: "/locations" },
  { method: "GET", path: "/members" },
  { method: "GET", path: "/roles" },
];

export function ApiAppConnectWizard({
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
  const [name, setName] = React.useState("API App");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setStep("setup");
      setName("API App");
      setDescription("");
      setError(null);
      setSecret(null);
    }
  }, [open]);

  async function connect() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}/integrations/api-apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Couldn't create this API app.");
        return;
      }
      setSecret(data.secret);
      onConnected(data.integration);
      setStep("done");
    } finally {
      setSaving(false);
    }
  }

  const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/public/v1`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {step === "setup" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" /> New API App
              </DialogTitle>
              <DialogDescription>Generate a key to build a bot or custom tool against the Breakroom API.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Field label="Name" htmlFor="api-app-name">
                <Input id="api-app-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              </Field>
              <Field label="Description" htmlFor="api-app-description" hint="Optional — what's this app for?">
                <Textarea id="api-app-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} className="min-h-[70px]" />
              </Field>
              {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
              <Button onClick={connect} disabled={!name.trim()} loading={saving} className="w-full">
                Create API app <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : null}

        {step === "done" && secret ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PartyPopper className="h-5 w-5 text-success" /> API app created
              </DialogTitle>
              <DialogDescription>This key is shown once — copy it now, it can't be retrieved again.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <code className="truncate text-sm">{secret}</code>
                  <CopyButton value={secret} label="Copy key" />
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Base URL</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="truncate text-xs text-muted-foreground">{baseUrl}</code>
                  <CopyButton value={baseUrl} label="Copy" />
                </div>
                <p className="pt-1 text-xs font-medium text-muted-foreground">Authorization header</p>
                <code className="block truncate text-xs text-muted-foreground">Authorization: Bearer {secret}</code>
              </div>

              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Endpoints</p>
                <div className="space-y-1">
                  {ENDPOINTS.map((e) => (
                    <div key={`${e.method} ${e.path}`} className="flex items-center gap-2 text-xs">
                      <span className="w-14 shrink-0 font-mono font-semibold text-primary">{e.method}</span>
                      <span className="truncate font-mono text-muted-foreground">{e.path}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => onOpenChange(false)} className="w-full">
                Done
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
