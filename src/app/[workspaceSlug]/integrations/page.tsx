import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { listIntegrations, computeIntegrationStatus } from "@/lib/services/integrations";
import { getIntegrationType } from "@/lib/integrations/registry";
import { getWorkspaceBasePath } from "@/lib/workspace-base-path";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Plug } from "lucide-react";

export const metadata = { title: "Integrations" };

export default async function IntegrationsIndexPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const basePath = getWorkspaceBasePath(params.workspaceSlug);
  const rows = (await listIntegrations(membership.workspace.id)).filter((r) => r.enabled);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">Connected tools and live feeds for {membership.workspace.name}.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Plug className="h-6 w-6" />}
          title="No integrations connected yet"
          description="Ask a workspace admin to connect one from Admin → Integrations."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const def = getIntegrationType(row.type);
            if (!def) return null;
            const status = computeIntegrationStatus(row);
            return (
              <Link key={row.id} href={`${basePath}/integrations/roblox/${row.id}`}>
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary">
                      <def.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.name}</p>
                      <Badge variant={status === "connected" ? "success" : "secondary"} className="mt-1">
                        {status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
