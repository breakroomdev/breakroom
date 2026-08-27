import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function listHubLinks(workspaceId: string) {
  const db = await getDb();
  return db.query.hubLinks.findMany({
    where: eq(schema.hubLinks.workspaceId, workspaceId),
    orderBy: [asc(schema.hubLinks.position), asc(schema.hubLinks.createdAt)],
  });
}
