import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

/** One-time cleanup: removes the disposable "csrf-test-co" workspace + its owner account created for debugging. */
async function main() {
  const url = process.env.DATABASE_URL ?? "file:./sqlite.db";
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  const db = drizzle(client, { schema });

  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, "csrf-test-co") });
  if (workspace) {
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspace.id));
    console.log("Deleted workspace csrf-test-co:", workspace.id);
  } else {
    console.log("Workspace csrf-test-co not found — already cleaned up.");
  }

  const user = await db.query.users.findFirst({ where: eq(schema.users.username, "csrftestdebug") });
  if (user) {
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    console.log("Deleted user csrftestdebug:", user.id);
  } else {
    console.log("User csrftestdebug not found — already cleaned up.");
  }

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
