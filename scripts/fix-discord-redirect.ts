import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

/**
 * One-time fix: clears the "hq" workspace's stored Discord redirect URI
 * override (was pointing at a stale preview domain) so it falls back to the
 * APP_URL-derived default (https://breakroom.team/api/auth/discord/callback),
 * which stays correct automatically if the domain ever changes again.
 */
async function main() {
  const url = process.env.DATABASE_URL ?? "file:./sqlite.db";
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  const db = drizzle(client, { schema });

  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, "hq") });
  if (!workspace) {
    console.log('fix-discord-redirect: no workspace with slug "hq" found — skipping.');
    client.close();
    return;
  }

  await db.update(schema.workspaceSettings).set({ discordRedirectUri: null }).where(eq(schema.workspaceSettings.workspaceId, workspace.id));
  console.log(`fix-discord-redirect: cleared discordRedirectUri override for workspace ${workspace.id}.`);
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
