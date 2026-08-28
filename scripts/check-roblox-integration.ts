import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

/** Read-only diagnostic: prints every Roblox integration's state (no secrets). */
async function main() {
  const url = process.env.DATABASE_URL ?? "file:./sqlite.db";
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  const db = drizzle(client, { schema });

  const rows = await db.query.integrations.findMany({ where: eq(schema.integrations.type, "roblox_chat") });

  console.log(
    "roblox integrations:",
    JSON.stringify(
      rows.map((r) => ({
        id: r.id,
        workspaceId: r.workspaceId,
        name: r.name,
        enabled: r.enabled,
        config: r.config,
        secretLastFour: r.secretLastFour,
        lastActivityAt: r.lastActivityAt,
        lastErrorAt: r.lastErrorAt,
        lastError: r.lastError,
        messageCount: r.messageCount,
        createdAt: r.createdAt,
      })),
      null,
      2
    )
  );

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
