import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";
import { getCurrentUser } from "@/lib/auth/session";
import { workspaceUrl } from "@/lib/workspace-url";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { AcceptInviteButton } from "@/components/auth/accept-invite-button";

export const metadata = { title: "Join workspace" };

export default async function JoinPage({ params }: { params: { token: string } }) {
  const db = await getDb();
  const tokenHash = await hashToken(params.token);
  const invite = await db.query.invites.findFirst({
    where: and(eq(schema.invites.tokenHash, tokenHash), isNull(schema.invites.acceptedAt), gt(schema.invites.expiresAt, new Date())),
  });

  if (!invite) {
    return (
      <AuthShell title="Invite not found">
        <p className="text-sm text-muted-foreground">
          This invite link is invalid or has expired. Ask your workspace admin to send a new one.
        </p>
      </AuthShell>
    );
  }

  const [workspace, user] = await Promise.all([
    db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, invite.workspaceId) }),
    getCurrentUser(),
  ]);

  if (user) {
    const existing = await db.query.workspaceMembers.findFirst({
      where: and(eq(schema.workspaceMembers.workspaceId, invite.workspaceId), eq(schema.workspaceMembers.userId, user.id)),
    });
    if (existing && workspace) redirect(workspaceUrl(workspace.slug));

    return (
      <AuthShell title={`Join ${workspace?.name ?? "workspace"}`} subtitle={`You're signed in as ${user.displayName}.`}>
        <AcceptInviteButton token={params.token} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={`Join ${workspace?.name ?? "workspace"}`} subtitle="Create your account to get started.">
      <RegisterForm invite={params.token} inviteWorkspaceName={workspace?.name} />
    </AuthShell>
  );
}
