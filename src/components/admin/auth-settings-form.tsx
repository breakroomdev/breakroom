"use client";

import * as React from "react";
import { toast } from "sonner";
import { KeyRound, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useWorkspace } from "@/components/workspace-context";

interface Initial {
  authPasswordEnabled: boolean;
  authDiscordEnabled: boolean;
  allowSelfRegistration: boolean;
}

export function AuthSettingsForm({ initial }: { initial: Initial }) {
  const { workspace } = useWorkspace();
  const [form, setForm] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error("Couldn't save authentication settings.");
        return;
      }
      toast.success("Authentication settings saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>Sign-in methods</CardTitle>
            <CardDescription>Control how members can sign in to this workspace.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Username & password</p>
              <p className="text-xs text-muted-foreground">Members sign in with a password.</p>
            </div>
            <Switch checked={form.authPasswordEnabled} onCheckedChange={(v) => setForm((f) => ({ ...f, authPasswordEnabled: v }))} />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Allow self-registration</p>
              <p className="text-xs text-muted-foreground">Anyone can create an account and join, without an invite.</p>
            </div>
            <Switch checked={form.allowSelfRegistration} onCheckedChange={(v) => setForm((f) => ({ ...f, allowSelfRegistration: v }))} />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>Discord SSO</CardTitle>
            <CardDescription>Let members sign in with Discord, using this instance's shared Discord app.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Enable Discord sign-in</p>
            <Switch checked={form.authDiscordEnabled} onCheckedChange={(v) => setForm((f) => ({ ...f, authDiscordEnabled: v }))} />
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>
          Save authentication settings
        </Button>
      </div>
    </div>
  );
}
