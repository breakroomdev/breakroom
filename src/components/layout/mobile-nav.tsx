"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, SECONDARY_NAV, ADMIN_NAV, type NavItem } from "@/lib/nav";
import { Logo } from "@/components/brand/logo";

const BOTTOM_ITEMS: NavItem[] = [PRIMARY_NAV[0]!, PRIMARY_NAV[1]!, PRIMARY_NAV[2]!, PRIMARY_NAV[5]!];

export function MobileBottomNav({ workspaceSlug, isAdmin }: { workspaceSlug: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden">
        {BOTTOM_ITEMS.map((item) => {
          const href = `/${workspaceSlug}${item.href}`;
          const isActive = item.href === "" ? pathname === href : pathname.startsWith(href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={href}
              className={cn("flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button onClick={() => setOpen(true)} className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground">
          <Menu className="h-5 w-5" />
          More
        </button>
      </nav>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-fade-in lg:hidden" />
          <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-[82%] max-w-xs flex-col bg-card p-4 shadow-popover data-[state=open]:animate-fade-in lg:hidden">
            <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <DialogPrimitive.Close className="rounded-md p-1.5 hover:bg-muted">
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {[...PRIMARY_NAV, ...SECONDARY_NAV, ...(isAdmin ? ADMIN_NAV : [])].map((item) => {
                const href = `/${workspaceSlug}${item.href}`;
                const isActive = item.href === "" ? pathname === href : pathname.startsWith(href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium", isActive ? "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300" : "text-foreground/80 hover:bg-muted")}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
