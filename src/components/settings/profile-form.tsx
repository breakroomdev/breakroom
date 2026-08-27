"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AvatarUpload } from "@/components/settings/avatar-upload";

interface ProfileFormProps {
  initial: {
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    jobTitle: string | null;
    department: string | null;
    pronouns: string | null;
    phone: string | null;
    hideEmail: boolean;
  };
}

export function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) {
        toast.error("Couldn't save your profile.");
        return;
      }
      toast.success("Profile updated");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
        <CardDescription>This is what teammates see across Breakroom.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <AvatarUpload name={form.displayName} url={form.avatarUrl} onChange={(url) => update("avatarUrl", url)} />

          <Field label="Display name" htmlFor="displayName">
            <Input id="displayName" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} required />
          </Field>

          <Field label="Bio" htmlFor="bio" hint="A short line about you.">
            <Textarea id="bio" value={form.bio ?? ""} onChange={(e) => update("bio", e.target.value)} maxLength={500} className="min-h-[80px]" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Job title" htmlFor="jobTitle">
              <Input id="jobTitle" value={form.jobTitle ?? ""} onChange={(e) => update("jobTitle", e.target.value)} />
            </Field>
            <Field label="Department" htmlFor="department">
              <Input id="department" value={form.department ?? ""} onChange={(e) => update("department", e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Pronouns" htmlFor="pronouns" hint="Optional">
              <Input id="pronouns" value={form.pronouns ?? ""} onChange={(e) => update("pronouns", e.target.value)} placeholder="she/her" />
            </Field>
            <Field label="Phone" htmlFor="phone" hint="Optional">
              <Input id="phone" value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
            </Field>
          </div>

          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Hide my email from teammates</p>
              <p className="text-xs text-muted-foreground">Your email stays visible to workspace admins.</p>
            </div>
            <Switch checked={form.hideEmail} onCheckedChange={(v) => setForm((f) => ({ ...f, hideEmail: v }))} />
          </label>

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
