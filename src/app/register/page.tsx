import Link from "next/link";
import { eq } from "drizzle-orm";
import { X } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { DiscordButton } from "@/components/auth/discord-button";
import { WorkspacePicker } from "@/components/auth/workspace-picker";
import { Avatar } from "@/components/ui/avatar";
import { workspaceDisplayHost } from "@/lib/workspace-url";
import { getRequestWorkspaceSlug } from "@/lib/workspace-base-path";
import { getInstanceDiscordCredentials } from "@/lib/auth/discord-config";

export const metadata = { title: "Create your account" };

async function getJoinWorkspace(slug?: string) {
  if (!slug) return null;
  const db = await getDb();
  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, slug), with: { settings: true } });
  if (!workspace) return null;
  const settings = workspace.settings;
  return {
    name: workspace.name,
    slug: workspace.slug,
    logoUrl: workspace.logoUrl,
    allowSelfRegistration: settings?.allowSelfRegistration ?? true,
    authDiscordEnabled: Boolean(settings?.authDiscordEnabled),
  };
}

export default async function RegisterPage({ searchParams }: { searchParams: { workspace?: string } }) {
  const fromHost = !searchParams.workspace && !!getRequestWorkspaceSlug();
  const workspaceSlug = searchParams.workspace ?? getRequestWorkspaceSlug() ?? undefined;
  const joinWorkspace = await getJoinWorkspace(workspaceSlug);
  const instanceDiscordConfigured = Boolean(await getInstanceDiscordCredentials());
  const discordEnabled = instanceDiscordConfigured && (joinWorkspace ? joinWorkspace.authDiscordEnabled : true);

  return (
    <AuthShell
      title={joinWorkspace ? "Join your team" : "Create your Breakroom"}
      subtitle={joinWorkspace ? undefined : "Set up a free workspace for your team in a couple of minutes."}
    >
      <div className="space-y-4">
        {joinWorkspace ? (
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar name={joinWorkspace.name} src={joinWorkspace.logoUrl} size="sm" />
              <div>
                <p className="text-sm font-medium leading-tight">{joinWorkspace.name}</p>
                <p className="text-xs text-muted-foreground">{workspaceDisplayHost(joinWorkspace.slug)}</p>
              </div>
            </div>
            {fromHost ? null : (
              <Link href="/register" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Search a different workspace">
                <X className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <>
            <WorkspacePicker basePath="/register" />
            <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or start a new one
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        {joinWorkspace && !joinWorkspace.allowSelfRegistration ? (
          <p className="rounded-lg bg-warning/15 px-3 py-2.5 text-sm text-warning-strong">
            {joinWorkspace.name} requires an invite to join. Ask a workspace admin to send you one, or{" "}
            <Link href="/register" className="font-medium underline">
              start your own workspace
            </Link>
            .
          </p>
        ) : (
          <>
            {discordEnabled ? (
              <>
                <DiscordButton label="Sign up with Discord" workspaceSlug={joinWorkspace?.slug} />
                <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  or
                  <div className="h-px flex-1 bg-border" />
                </div>
              </>
            ) : null}
            <RegisterForm joinWorkspaceSlug={joinWorkspace?.slug} joinWorkspaceName={joinWorkspace?.name} />
          </>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={joinWorkspace ? `/login?workspace=${joinWorkspace.slug}` : "/login"} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
