import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { DiscordButton } from "@/components/auth/discord-button";

export const metadata = { title: "Sign in" };

async function getAuthMethods(workspaceSlug?: string) {
  let passwordEnabled = true;
  let discordEnabled = Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);

  if (workspaceSlug) {
    const db = await getDb();
    const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, workspaceSlug) });
    if (workspace) {
      const settings = await db.query.workspaceSettings.findFirst({ where: eq(schema.workspaceSettings.workspaceId, workspace.id) });
      if (settings) {
        passwordEnabled = settings.authPasswordEnabled;
        discordEnabled = discordEnabled || Boolean(settings.authDiscordEnabled && settings.discordClientId);
      }
    }
  }

  return { passwordEnabled, discordEnabled };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { workspace?: string; error?: string; next?: string };
}) {
  const { passwordEnabled, discordEnabled } = await getAuthMethods(searchParams.workspace);
  const redirectTo = searchParams.next ?? (searchParams.workspace ? `/${searchParams.workspace}` : "/workspaces");

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to catch up with your team.">
      <div className="space-y-4">
        {searchParams.error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{searchParams.error}</p>
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
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
