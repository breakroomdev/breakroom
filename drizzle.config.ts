import { defineConfig } from "drizzle-kit";
import "dotenv/config";

// Used by `drizzle-kit generate` (schema -> SQL migration diffing, no live
// connection needed) and `drizzle-kit studio` (browses whatever DATABASE_URL
// points at locally). Production migrations run through scripts/migrate.ts,
// which also understands DATABASE_AUTH_TOKEN for a remote Turso database.
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./sqlite.db",
  },
  verbose: true,
  strict: true,
});
