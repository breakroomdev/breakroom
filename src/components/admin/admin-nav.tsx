"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/permissions";

const TABS: { label: string; href: string; permission: Permission }[] = [
  { label: "Overview", href: "", permission: "workspace.manage" },
  { label: "Members", href: "/members", permission: "members.manage" },
  { label: "Roles", href: "/roles", permission: "roles.manage" },
  { label: "Schedule", href: "/schedule", permission: "schedule.manage" },
  { label: "Hub", href: "/hub", permission: "workspace.manage" },
  { label: "Integrations", href: "/integrations", permission: "workspace.manage" },
  { label: "Workspace", href: "/workspace", permission: "workspace.manage" },
  { label: "Authentication", href: "/auth", permission: "workspace.manage" },
  { label: "Moderation", href: "/moderation", permission: "posts.moderate" },
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
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
