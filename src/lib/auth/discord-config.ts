import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { OAuthProviderConfig } from "./providers/base";

export const OAUTH_STATE_COOKIE = "bx_oauth_nonce";

/**
 * Resolves which Discord app credentials to use: the workspace's own
 * (configured by its admin from Admin > Authentication) if enabled,
 * otherwise the instance-wide defaults from environment variables.
 */
export async function resolveDiscordConfig(workspaceSlug: string | null): Promise<OAuthProviderConfig | null> {
  if (workspaceSlug) {
    const db = await getDb();
    const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, workspaceSlug), with: { settings: true } });
    if (workspace) {
      const settings = workspace.settings;
      if (settings?.authDiscordEnabled && settings.discordClientId && settings.discordClientSecret) {
        return {
          clientId: settings.discordClientId,
          clientSecret: settings.discordClientSecret,
          redirectUri: settings.discordRedirectUri || `${process.env.APP_URL}/api/auth/discord/callback`,
        };
      }
    }
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
