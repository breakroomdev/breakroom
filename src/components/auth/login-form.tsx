"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export function LoginForm({ workspaceSlug, redirectTo }: { workspaceSlug?: string; redirectTo: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message ?? "Something went wrong.");
        return;
      }

      toast.success("Welcome back!");
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Username or email" htmlFor="identifier">
        <Input id="identifier" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Sign in
      </Button>
    </form>
  );
}
