"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Something went wrong.");
        return;
      }
      toast.success("Password updated. Please sign in.");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Invalid link">
        <p className="text-sm text-muted-foreground">
          This password reset link is missing its token. Request a new one from the{" "}
          <Link href="/forgot-password" className="text-primary hover:underline">
            forgot password page
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="New password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
