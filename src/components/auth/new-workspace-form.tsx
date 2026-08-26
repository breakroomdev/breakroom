"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { slugify } from "@/lib/utils";

export function NewWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Something went wrong.");
        return;
      }
      toast.success("Workspace created!");
      router.push(`/${data.slug}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Workspace name" htmlFor="name">
        <Input id="name" placeholder="Acme Inc." required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      {name ? <p className="text-xs text-muted-foreground">Your workspace URL: /{slugify(name) || "workspace"}</p> : null}
      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Create workspace
      </Button>
    </form>
  );
}
