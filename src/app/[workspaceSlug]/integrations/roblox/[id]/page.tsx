import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { getIntegration } from "@/lib/services/integrations";
import { listRobloxMessages } from "@/lib/services/roblox";
import { RobloxChatViewer } from "@/components/integrations/roblox-chat-viewer";

export const metadata = { title: "Roblox Chat" };

export default async function RobloxChatPage({ params }: { params: { workspaceSlug: string; id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const integration = await getIntegration(membership.workspace.id, params.id);
  if (!integration || integration.type !== "roblox_chat") notFound();

  const { messages, nextCursor } = await listRobloxMessages(integration.id, { limit: 30 });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">{integration.name}</h1>
        <p className="text-muted-foreground">Live chat from your Roblox experience.</p>
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
