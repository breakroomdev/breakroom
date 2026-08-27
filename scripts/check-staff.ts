import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

/** Read-only diagnostic: prints who owns "hq" and every user's isSiteAdmin status. */
async function main() {
  const url = process.env.DATABASE_URL ?? "file:./sqlite.db";
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  const db = drizzle(client, { schema });

  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, "hq") });
  console.log("hq workspace:", workspace ? { id: workspace.id, ownerId: workspace.ownerId, slug: workspace.slug } : null);

  const admins = await db.query.users.findMany({ where: eq(schema.users.isSiteAdmin, true) });
  console.log(
    "users with isSiteAdmin=true:",
    admins.map((u) => ({ id: u.id, username: u.username, email: u.email }))
  );

  if (workspace) {
    const owner = await db.query.users.findFirst({ where: eq(schema.users.id, workspace.ownerId) });
    console.log("hq owner:", owner ? { id: owner.id, username: owner.username, email: owner.email, isSiteAdmin: owner.isSiteAdmin } : null);
  }

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
