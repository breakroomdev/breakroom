"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WorkspaceLogo } from "@/components/brand/workspace-logo";

interface WorkspaceOption {
  slug: string;
  name: string;
  logoUrl: string | null;
}

export function WorkspaceSwitcher({ current, others }: { current: WorkspaceOption; others: WorkspaceOption[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <WorkspaceLogo name={current.name} logoUrl={current.logoUrl} size="md" />
        <span className="flex-1 truncate font-display text-sm font-semibold">{current.name}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        <DropdownMenuItem disabled className="opacity-100">
          <WorkspaceLogo name={current.name} logoUrl={current.logoUrl} size="sm" />
          {current.name}
          <Check className="ml-auto h-4 w-4 text-primary" />
        </DropdownMenuItem>
        {others.map((w) => (
          <DropdownMenuItem key={w.slug} asChild>
            <Link href={`/${w.slug}`}>
              <WorkspaceLogo name={w.name} logoUrl={w.logoUrl} size="sm" />
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
