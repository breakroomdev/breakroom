"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

interface RegisterFormProps {
  invite?: string;
  inviteWorkspaceName?: string;
  joinWorkspaceSlug?: string;
  joinWorkspaceName?: string;
}

export function RegisterForm({ invite, inviteWorkspaceName, joinWorkspaceSlug, joinWorkspaceName }: RegisterFormProps) {
  const router = useRouter();
  const skipWorkspaceName = Boolean(invite || joinWorkspaceSlug);
  const [form, setForm] = React.useState({
    displayName: "",
    email: "",
    username: "",
    password: "",
    workspaceName: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          email: form.email,
          username: form.username,
          password: form.password,
          workspaceName: skipWorkspaceName ? undefined : form.workspaceName || undefined,
          joinWorkspaceSlug,
          invite,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message ?? "Something went wrong.");
        return;
      }

      toast.success("Account created — welcome to Breakroom!");
      router.push(data.workspaceSlug ? `/${data.workspaceSlug}` : "/workspaces");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {invite && inviteWorkspaceName ? (
        <p className="rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
          You're joining <strong>{inviteWorkspaceName}</strong>
        </p>
      ) : null}
      {!invite && joinWorkspaceSlug && joinWorkspaceName ? (
        <p className="rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
          You're joining <strong>{joinWorkspaceName}</strong>
        </p>
      ) : null}

      <Field label="Full name" htmlFor="displayName">
        <Input id="displayName" autoComplete="name" required value={form.displayName} onChange={(e) => update("displayName", e.target.value)} />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
      </Field>
      <Field label="Username" htmlFor="username" hint="Letters, numbers, dots and underscores only.">
        <Input id="username" autoComplete="username" required value={form.username} onChange={(e) => update("username", e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} />
      </Field>

      {!skipWorkspaceName ? (
        <Field label="Workspace name" htmlFor="workspaceName" hint="Give your team's workspace a name — you can invite teammates after.">
          <Input id="workspaceName" placeholder="Acme Inc." required value={form.workspaceName} onChange={(e) => update("workspaceName", e.target.value)} />
        </Field>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Create account
      </Button>
    </form>
  );
}
