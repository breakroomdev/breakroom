import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { OAuthProviderConfig } from "./providers/base";

export const OAUTH_STATE_COOKIE = "bx_oauth_nonce";

/**
 * The one shared Discord app every workspace's "Discord sign-in" toggle uses.
 * Sourced from the "hq" workspace's stored credentials (the instance's own
 * workspace) so there's a single place to manage them, falling back to
 * instance-wide env vars for self-hosters who don't have an "hq" workspace.
 */
export async function getInstanceDiscordCredentials(): Promise<OAuthProviderConfig | null> {
  const db = await getDb();
  const hq = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, "hq"), with: { settings: true } });

  if (hq?.settings?.discordClientId && hq.settings.discordClientSecret) {
    return {
      clientId: hq.settings.discordClientId,
      clientSecret: hq.settings.discordClientSecret,
      redirectUri: hq.settings.discordRedirectUri || `${process.env.APP_URL}/api/auth/discord/callback`,
    };
  }

  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    return {
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      redirectUri: process.env.DISCORD_REDIRECT_URI || `${process.env.APP_URL}/api/auth/discord/callback`,
    };
  }

  return null;
}

/**
 * Resolves the Discord config for a sign-in attempt. Workspaces can no longer
 * bring their own Discord app — they can only enable/disable it, gating access
 * to the shared instance-wide app above.
 */
export async function resolveDiscordConfig(workspaceSlug: string | null): Promise<OAuthProviderConfig | null> {
  const instance = await getInstanceDiscordCredentials();
  if (!instance) return null;

  if (workspaceSlug) {
    const db = await getDb();
    const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, workspaceSlug), with: { settings: true } });
    if (!workspace?.settings?.authDiscordEnabled) return null;
  }

  return instance;
}
