"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, SECONDARY_NAV, ADMIN_NAV, type NavItem } from "@/lib/nav";

function NavGroup({ basePath, items, label }: { basePath: string; items: NavItem[]; label?: string }) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {label ? <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">{label}</p> : null}
      {items.map((item) => {
        const href = `${basePath}${item.href}` || "/";
        const isActive = item.href === "" ? pathname === href : pathname.startsWith(href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-muted",
              isActive ? "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300" : "text-foreground/80"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function SidebarNav({ basePath, isAdmin }: { basePath: string; isAdmin: boolean }) {
  return (
    <div className="space-y-4">
      <NavGroup basePath={basePath} items={PRIMARY_NAV} />
      <div className="h-px bg-border" />
      <NavGroup basePath={basePath} items={SECONDARY_NAV} />
      {isAdmin ? (
        <>
          <div className="h-px bg-border" />
          <NavGroup basePath={basePath} items={ADMIN_NAV} label="Workspace" />
        </>
      ) : null}
    </div>
  );
}
