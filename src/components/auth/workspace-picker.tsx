"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { workspaceDisplayHost } from "@/lib/workspace-url";

interface WorkspaceResult {
  name: string;
  slug: string;
  logoUrl: string | null;
}

const LISTBOX_ID = "workspace-search-results";

/** Search-as-you-type workspace lookup, used to enter a workspace's branded sign-in (its own Discord app, password policy, etc). */
export function WorkspacePicker({ basePath }: { basePath: "/login" | "/register" }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<WorkspaceResult[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  // When Escape/ArrowUp programmatically return focus to the input, that
  // focus event would otherwise immediately reopen the dropdown via
  // onFocus below — this flag tells onFocus to skip reopening just once.
  const suppressReopenRef = React.useRef(false);

  function refocusInput() {
    suppressReopenRef.current = true;
    inputRef.current?.focus();
  }

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

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown" && open && results?.length) {
      e.preventDefault();
      itemRefs.current[0]?.focus();
    }
  }

  function onItemKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = results?.length ?? 0;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      itemRefs.current[Math.min(index + 1, count - 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index === 0) refocusInput();
      else itemRefs.current[index - 1]?.focus();
    } else if (e.key === "Escape") {
      setOpen(false);
      refocusInput();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suppressReopenRef.current) {
              suppressReopenRef.current = false;
              return;
            }
            if (results) setOpen(true);
          }}
          onKeyDown={onInputKeyDown}
          placeholder="Find your workspace…"
          className="pl-9"
          aria-label="Search for your workspace"
          role="combobox"
          aria-expanded={open}
          aria-controls={LISTBOX_ID}
          autoComplete="off"
        />
        {loading ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" /> : null}
      </div>

      {open && results ? (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-popover animate-scale-in">
          {results.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-muted-foreground">No workspaces found for "{query.trim()}".</p>
          ) : (
            <ul id={LISTBOX_ID} role="listbox" aria-label="Matching workspaces" className="max-h-64 overflow-y-auto py-1.5">
              {results.map((w, i) => (
                <li key={w.slug} role="presentation">
                  <button
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => select(w.slug)}
                    onKeyDown={(e) => onItemKeyDown(e, i)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors hover:bg-muted",
                      "focus-visible:outline-none focus-visible:bg-muted"
                    )}
                  >
                    <Avatar name={w.name} src={w.logoUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{w.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{workspaceDisplayHost(w.slug)}</p>
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
