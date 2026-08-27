import Link from "next/link";
import { eq } from "drizzle-orm";
import { X } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { DiscordButton } from "@/components/auth/discord-button";
import { WorkspacePicker } from "@/components/auth/workspace-picker";
import { Avatar } from "@/components/ui/avatar";
import { workspaceUrl, workspaceDisplayHost } from "@/lib/workspace-url";

export const metadata = { title: "Sign in" };

async function getWorkspaceAuthContext(workspaceSlug?: string) {
  let passwordEnabled = true;
  let discordEnabled = Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
  let workspace: { name: string; slug: string; logoUrl: string | null } | null = null;
  let allowSelfRegistration = true;

  if (workspaceSlug) {
    const db = await getDb();
    const found = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, workspaceSlug) });
    if (found) {
      workspace = { name: found.name, slug: found.slug, logoUrl: found.logoUrl };
      const settings = await db.query.workspaceSettings.findFirst({ where: eq(schema.workspaceSettings.workspaceId, found.id) });
      if (settings) {
        passwordEnabled = settings.authPasswordEnabled;
        discordEnabled = discordEnabled || Boolean(settings.authDiscordEnabled && settings.discordClientId);
        allowSelfRegistration = settings.allowSelfRegistration;
      }
    }
  }

  return { passwordEnabled, discordEnabled, workspace, allowSelfRegistration };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { workspace?: string; error?: string; next?: string };
}) {
  const { passwordEnabled, discordEnabled, workspace, allowSelfRegistration } = await getWorkspaceAuthContext(searchParams.workspace);
  const redirectTo = searchParams.next ?? (searchParams.workspace ? workspaceUrl(searchParams.workspace) : "/workspaces");

  return (
    <AuthShell title={workspace ? "Sign in" : "Welcome back"} subtitle={workspace ? undefined : "Find your workspace, or sign in to see all of yours."}>
      <div className="space-y-4">
        {searchParams.error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{searchParams.error}</p>
        ) : null}

        {workspace ? (
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar name={workspace.name} src={workspace.logoUrl} size="sm" />
              <div>
                <p className="text-sm font-medium leading-tight">{workspace.name}</p>
                <p className="text-xs text-muted-foreground">{workspaceDisplayHost(workspace.slug)}</p>
              </div>
            </div>
            <Link href="/login" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Search a different workspace">
              <X className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <WorkspacePicker basePath="/login" />
        )}

        {!workspace ? (
          <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or sign in directly
            <div className="h-px flex-1 bg-border" />
          </div>
        ) : null}

        {discordEnabled ? <DiscordButton workspaceSlug={searchParams.workspace} /> : null}

        {discordEnabled && passwordEnabled ? (
          <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>
        ) : null}

        {passwordEnabled ? <LoginForm workspaceSlug={searchParams.workspace} redirectTo={redirectTo} /> : null}

        {!passwordEnabled && !discordEnabled ? (
          <p className="text-center text-sm text-muted-foreground">
            No sign-in methods are enabled for this workspace. Contact your workspace admin.
          </p>
        ) : null}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Breakroom?{" "}
        {workspace ? (
          allowSelfRegistration ? (
            <Link href={`/register?workspace=${workspace.slug}`} className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          ) : (
            <span>Ask an admin at {workspace.name} for an invite.</span>
          )
        ) : (
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        )}
      </p>
    </AuthShell>
  );
}
