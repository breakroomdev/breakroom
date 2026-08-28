"use client";

import * as React from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't update password.");
        return;
      }
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning-strong">
          <KeyRound className="h-4 w-4" />
        </div>
        <div>
          <CardTitle>Password</CardTitle>
          <CardDescription>{hasPassword ? "Change your password." : "Set a password to also sign in without Discord."}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          {hasPassword ? (
            <Field label="Current password" htmlFor="current">
              <Input id="current" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </Field>
          ) : null}
          <Field label="New password" htmlFor="new" hint="At least 8 characters.">
            <Input id="new" type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              Update password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
