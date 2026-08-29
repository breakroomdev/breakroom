"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, ShieldCheck, CalendarDays, LayoutGrid, Plug, Building2, KeyRound, Flag, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/permissions";

const TABS: { label: string; href: string; permission: Permission; icon: LucideIcon }[] = [
  { label: "Overview", href: "", permission: "workspace.manage", icon: LayoutDashboard },
  { label: "Members", href: "/members", permission: "members.manage", icon: Users },
  { label: "Roles", href: "/roles", permission: "roles.manage", icon: ShieldCheck },
  { label: "Schedule", href: "/schedule", permission: "schedule.manage", icon: CalendarDays },
  { label: "Hub", href: "/hub", permission: "workspace.manage", icon: LayoutGrid },
  { label: "Integrations", href: "/integrations", permission: "workspace.manage", icon: Plug },
  { label: "Knowledge Base", href: "/kb", permission: "workspace.manage", icon: BookOpen },
  { label: "Workspace", href: "/workspace", permission: "workspace.manage", icon: Building2 },
  { label: "Authentication", href: "/auth", permission: "workspace.manage", icon: KeyRound },
  { label: "Moderation", href: "/moderation", permission: "posts.moderate", icon: Flag },
];

export function AdminNav({ basePath, permissions }: { basePath: string; permissions: string[] }) {
  const pathname = usePathname();
  const base = `${basePath}/admin`;
  const visible = TABS.filter((t) => permissions.includes(t.permission));

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
      {visible.map((tab) => {
        const href = `${base}${tab.href}`;
        const isActive = pathname === href;
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
