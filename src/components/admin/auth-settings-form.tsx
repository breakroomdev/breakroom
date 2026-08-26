"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useWorkspace } from "@/components/workspace-context";

interface Initial {
  authPasswordEnabled: boolean;
  authDiscordEnabled: boolean;
  discordClientId: string;
  hasDiscordSecret: boolean;
  discordRedirectUri: string;
  allowSelfRegistration: boolean;
}

export function AuthSettingsForm({ initial }: { initial: Initial }) {
  const { workspace } = useWorkspace();
  const [form, setForm] = React.useState({ ...initial, discordClientSecret: "" });
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authPasswordEnabled: form.authPasswordEnabled,
          authDiscordEnabled: form.authDiscordEnabled,
          discordClientId: form.discordClientId,
          discordClientSecret: form.discordClientSecret,
          discordRedirectUri: form.discordRedirectUri,
          allowSelfRegistration: form.allowSelfRegistration,
        }),
      });
      if (!res.ok) {
        toast.error("Couldn't save authentication settings.");
        return;
      }
      toast.success("Authentication settings saved");
      setForm((f) => ({ ...f, discordClientSecret: "" }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign-in methods</CardTitle>
          <CardDescription>Control how members can sign in to this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        <CardHeader>
          <CardTitle>Discord SSO</CardTitle>
          <CardDescription>
            Let members sign in with Discord. Create an application at{" "}
            <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              discord.com/developers
            </a>
            , then paste its credentials below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Enable Discord sign-in</p>
            <Switch checked={form.authDiscordEnabled} onCheckedChange={(v) => setForm((f) => ({ ...f, authDiscordEnabled: v }))} />
          </label>

          <Field label="Client ID" htmlFor="clientId">
            <Input id="clientId" value={form.discordClientId} onChange={(e) => setForm((f) => ({ ...f, discordClientId: e.target.value }))} />
          </Field>
          <Field label="Client secret" htmlFor="clientSecret" hint={form.hasDiscordSecret ? "A secret is already saved. Leave blank to keep it." : "Never shown once saved."}>
            <Input
              id="clientSecret"
              type="password"
              placeholder={form.hasDiscordSecret ? "••••••••••••" : ""}
              value={form.discordClientSecret}
              onChange={(e) => setForm((f) => ({ ...f, discordClientSecret: e.target.value }))}
            />
          </Field>
          <Field label="Redirect URI" htmlFor="redirectUri" hint="Add this exact URL to your Discord app's OAuth2 redirects.">
            <Input id="redirectUri" value={form.discordRedirectUri} onChange={(e) => setForm((f) => ({ ...f, discordRedirectUri: e.target.value }))} />
          </Field>

          <div className="flex justify-end">
            <Button onClick={save} loading={saving}>
              Save authentication settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
