import { SidebarNav } from "@/components/layout/sidebar-nav";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileBottomNav } from "@/components/layout/mobile-nav";
import type { WorkspaceContextValue } from "@/components/workspace-context";

interface AppShellProps {
  ctx: WorkspaceContextValue;
  otherWorkspaces: { slug: string; name: string; logoUrl: string | null }[];
  children: React.ReactNode;
}

export function AppShell({ ctx, otherWorkspaces, children }: AppShellProps) {
  const isAdmin = ctx.permissions.includes("workspace.manage") || ctx.permissions.includes("members.manage");

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/60 p-3 lg:flex">
        <div className="mb-2 px-1 py-2">
          <WorkspaceSwitcher current={{ slug: ctx.workspace.slug, name: ctx.workspace.name, logoUrl: ctx.workspace.logoUrl }} others={otherWorkspaces} />
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav workspaceSlug={ctx.workspace.slug} isAdmin={isAdmin} />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:justify-end lg:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand font-display text-xs font-bold text-white">
              {ctx.workspace.name.slice(0, 1).toUpperCase()}
            </div>
            <span className="font-display text-sm font-semibold">{ctx.workspace.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell workspaceId={ctx.workspace.id} workspaceSlug={ctx.workspace.slug} initialUnread={ctx.unreadNotifications} />
            <UserMenu workspaceSlug={ctx.workspace.slug} name={ctx.user.displayName} username={ctx.user.username} avatarUrl={ctx.user.avatarUrl} isAdmin={isAdmin} />
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <MobileBottomNav workspaceSlug={ctx.workspace.slug} isAdmin={isAdmin} />
    </div>
  );
}
