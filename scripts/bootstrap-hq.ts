import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

/**
 * One-time bootstrap: renames the "breakroom" workspace to "hq" and grants its
 * owner staff (isSiteAdmin) access. Idempotent — no-ops once the rename has
 * already happened, so it's safe if this ever runs more than once.
 */
async function main() {
  const url = process.env.DATABASE_URL ?? "file:./sqlite.db";
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  const db = drizzle(client, { schema });

  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, "breakroom") });

  if (!workspace) {
    console.log('bootstrap-hq: no workspace with slug "breakroom" found — already done, skipping.');
    client.close();
    return;
  }

  await db.update(schema.workspaces).set({ slug: "hq" }).where(eq(schema.workspaces.id, workspace.id));
  await db.update(schema.users).set({ isSiteAdmin: true }).where(eq(schema.users.id, workspace.ownerId));

  console.log(`bootstrap-hq: renamed workspace ${workspace.id} to slug "hq" and granted isSiteAdmin to owner ${workspace.ownerId}.`);
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
