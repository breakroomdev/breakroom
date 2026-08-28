import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Gamepad2, MessagesSquare, Radio } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { getIntegration, computeIntegrationStatus } from "@/lib/services/integrations";
import { listRobloxMessages } from "@/lib/services/roblox";
import { getWorkspaceBasePath } from "@/lib/workspace-base-path";
import { relativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RobloxChatViewer } from "@/components/integrations/roblox-chat-viewer";

export const metadata = { title: "Roblox Chat" };

const STATUS_BADGE = {
  connected: "success",
  error: "destructive",
  disconnected: "secondary",
} as const;

export default async function RobloxChatPage({ params }: { params: { workspaceSlug: string; id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const integration = await getIntegration(membership.workspace.id, params.id);
  if (!integration || integration.type !== "roblox_chat") notFound();

  const { messages, nextCursor } = await listRobloxMessages(integration.id, { limit: 30 });
  const status = computeIntegrationStatus(integration);
  const config = integration.config as Record<string, string>;
  const basePath = getWorkspaceBasePath(params.workspaceSlug);

  return (
    <div>
      <Link
        href={`${basePath}/integrations`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Integrations
      </Link>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand-soft text-primary">
              <Gamepad2 className="h-7 w-7" />
            </div>
            {status === "connected" ? (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-success">
                <Radio className="h-2.5 w-2.5 text-success-foreground" />
              </span>
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{integration.name}</h1>
              <Badge variant={STATUS_BADGE[status]}>{status}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Universe {config.universeId ?? "—"} · Place {config.placeId ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5 rounded-xl border border-border px-3.5 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
              <MessagesSquare className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-none">{integration.messageCount}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Messages logged</p>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium leading-tight">
              {integration.lastActivityAt ? relativeTime(new Date(integration.lastActivityAt)) : "No activity yet"}
            </p>
            <p className="text-xs text-muted-foreground">Last message</p>
          </div>
        </div>
      </div>

      <RobloxChatViewer
        integrationId={integration.id}
        initialMessages={messages.map((m) => ({
          id: m.id,
          userId: m.userId,
          username: m.username,
          displayName: m.displayName,
          message: m.message,
          jobId: m.jobId,
          timestamp: m.timestamp.getTime(),
        }))}
        initialCursor={nextCursor}
      />
    </div>
  );
}
