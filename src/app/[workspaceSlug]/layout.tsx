import { redirect } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { WorkspaceProvider } from "@/components/workspace-context";
import { AppShell } from "@/components/layout/app-shell";
import { getWorkspaceBasePath } from "@/lib/workspace-base-path";
import type { Permission } from "@/lib/permissions";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspaceSlug: string };
}) {
  const basePath = getWorkspaceBasePath(params.workspaceSlug);

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${basePath || "/"}`);

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const db = await getDb();

  const [otherMemberships, unreadRow] = await Promise.all([
    db
      .select({ workspace: schema.workspaces })
      .from(schema.workspaceMembers)
      .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.workspaceMembers.workspaceId))
      .where(eq(schema.workspaceMembers.userId, user.id)),
    db
      .select({ value: count() })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, user.id), eq(schema.notifications.workspaceId, membership.workspace.id), eq(schema.notifications.isRead, false))),
  ]);

  const otherWorkspaces = otherMemberships.map((m) => m.workspace).filter((w) => w.slug !== params.workspaceSlug);

  const ctxValue = {
    basePath,
    workspace: {
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      logoUrl: membership.workspace.logoUrl,
      theme: membership.workspace.theme,
    },
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isSiteAdmin: user.isSiteAdmin,
    },
    role: { key: membership.role.key, name: membership.role.name },
    permissions: membership.role.permissions as Permission[],
    unreadNotifications: unreadRow[0]?.value ?? 0,
  };

  const resolvedTheme = user.themeOverride || membership.workspace.theme;

  return (
    <div data-workspace-theme={resolvedTheme} className="min-h-screen">
      <WorkspaceProvider value={ctxValue}>
        <AppShell ctx={ctxValue} otherWorkspaces={otherWorkspaces.map((w) => ({ slug: w.slug, name: w.name, logoUrl: w.logoUrl }))}>
          {children}
        </AppShell>
      </WorkspaceProvider>
    </div>
  );
}
