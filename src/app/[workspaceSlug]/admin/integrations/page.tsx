import { getMembership } from "@/lib/auth/authorize";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { listIntegrations, computeIntegrationStatus } from "@/lib/services/integrations";
import { IntegrationsManager } from "@/components/admin/integrations-manager";
import { getWorkspaceBasePath } from "@/lib/workspace-base-path";

export const metadata = { title: "Integrations" };

export default async function AdminIntegrationsPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const rows = await listIntegrations(membership.workspace.id);
  const basePath = getWorkspaceBasePath(params.workspaceSlug);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">Connect Breakroom to the other tools your team already uses.</p>
      </div>
      <IntegrationsManager
        basePath={basePath}
        initialIntegrations={rows.map((row) => ({
          id: row.id,
          type: row.type,
          name: row.name,
          enabled: row.enabled,
          config: row.config as Record<string, string>,
          status: computeIntegrationStatus(row),
          secretLastFour: row.secretLastFour,
          lastActivityAt: row.lastActivityAt?.getTime() ?? null,
          lastErrorAt: row.lastErrorAt?.getTime() ?? null,
          lastError: row.lastError,
          messageCount: row.messageCount,
          createdAt: row.createdAt.getTime(),
        }))}
      />
    </div>
  );
}
