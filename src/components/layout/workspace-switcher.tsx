"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface WorkspaceOption {
  slug: string;
  name: string;
  logoUrl: string | null;
}

export function WorkspaceSwitcher({ current, others }: { current: WorkspaceOption; others: WorkspaceOption[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-brand font-display text-sm font-bold text-white">
          {current.name.slice(0, 1).toUpperCase()}
        </div>
        <span className="flex-1 truncate font-display text-sm font-semibold">{current.name}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        <DropdownMenuItem disabled className="opacity-100">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-brand text-xs font-bold text-white">
            {current.name.slice(0, 1).toUpperCase()}
          </div>
          {current.name}
          <Check className="ml-auto h-4 w-4 text-primary" />
        </DropdownMenuItem>
        {others.map((w) => (
          <DropdownMenuItem key={w.slug} asChild>
            <Link href={`/${w.slug}`}>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-bold">
                {w.name.slice(0, 1).toUpperCase()}
              </div>
              {w.name}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/new-workspace">
            <Plus className="h-4 w-4" />
            Create workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
