"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface WorkspaceResult {
  name: string;
  slug: string;
  logoUrl: string | null;
}

/** Search-as-you-type workspace lookup, used to enter a workspace's branded sign-in (its own Discord app, password policy, etc). */
export function WorkspacePicker({ basePath }: { basePath: "/login" | "/register" }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<WorkspaceResult[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/workspaces/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) return;
        const data = await res.json();
        setResults(data.workspaces);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(slug: string) {
    setOpen(false);
    router.push(`${basePath}?workspace=${encodeURIComponent(slug)}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Find your workspace…"
          className="pl-9"
          aria-label="Search for your workspace"
        />
        {loading ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
      </div>

      {open && results ? (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-popover animate-scale-in">
          {results.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-muted-foreground">No workspaces found for "{query.trim()}".</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1.5">
              {results.map((w) => (
                <li key={w.slug}>
                  <button
                    type="button"
                    onClick={() => select(w.slug)}
                    className={cn("flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors hover:bg-muted")}
                  >
                    <Avatar name={w.name} src={w.logoUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{w.name}</p>
                      <p className="truncate text-xs text-muted-foreground">breakroom.app/{w.slug}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
