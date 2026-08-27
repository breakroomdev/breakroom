import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

const OWNER_ID = "5235b8fb-43c4-4970-8c8c-64b4fcec0bff"; // jye, owner of "hq"

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./sqlite.db";
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  const db = drizzle(client, { schema });

  const before = await db.query.users.findFirst({ where: eq(schema.users.id, OWNER_ID) });
  console.log("before:", before ? { username: before.username, isSiteAdmin: before.isSiteAdmin } : null);

  const result = await db.update(schema.users).set({ isSiteAdmin: true }).where(eq(schema.users.id, OWNER_ID)).returning();
  console.log("update() returned:", result);

  const after = await db.query.users.findFirst({ where: eq(schema.users.id, OWNER_ID) });
  console.log("after (same connection):", after ? { username: after.username, isSiteAdmin: after.isSiteAdmin } : null);

  client.close();

  // Re-open a fresh connection to rule out any client-side caching.
  const client2 = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  const db2 = drizzle(client2, { schema });
  const recheck = await db2.query.users.findFirst({ where: eq(schema.users.id, OWNER_ID) });
  console.log("recheck (fresh connection):", recheck ? { username: recheck.username, isSiteAdmin: recheck.isSiteAdmin } : null);
  client2.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
