import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

/**
 * Database access abstraction.
 *
 * Breakroom runs on two SQLite-compatible drivers depending on where it's
 * deployed, but the schema (./schema.ts) and every query written against
 * `getDb()` stay identical across both:
 *
 *  - Cloudflare (Workers/Pages): Cloudflare D1, via the "DB" binding.
 *  - Everywhere else (local dev, Vercel, self-hosted Node): libSQL. A
 *    local "file:./sqlite.db" URL for local dev / single-server hosting,
 *    or a remote Turso database (libsql://...) for serverless hosts like
 *    Vercel where the filesystem isn't persistent between invocations.
 *
 * Call `await getDb()` from route handlers / server components rather
 * than importing a module-level client, since the Cloudflare binding is
 * only available inside a request context.
 */

export type Database = Awaited<ReturnType<typeof buildNodeDb>>;

let cachedNodeDb: Database | undefined;

async function buildNodeDb() {
  const url = process.env.DATABASE_URL ?? "file:./sqlite.db";
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  await client.execute("PRAGMA foreign_keys = ON;");
  return drizzle(client, { schema });
}

async function buildCloudflareDb() {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { drizzle: drizzleD1 } = await import("drizzle-orm/d1");
  const { env } = getCloudflareContext();
  return drizzleD1((env as Record<string, unknown>).DB as Parameters<typeof drizzleD1>[0], { schema });
}

export async function getDb(): Promise<Database> {
  if (process.env.CLOUDFLARE === "true" || process.env.NEXT_RUNTIME === "edge") {
    return (await buildCloudflareDb()) as unknown as Database;
  }

  if (!cachedNodeDb) {
    cachedNodeDb = await buildNodeDb();
  }
  return cachedNodeDb;
}

export { schema };
