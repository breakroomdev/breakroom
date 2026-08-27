import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function listWorkspacesForStaff() {
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.workspaces.id,
      name: schema.workspaces.name,
      slug: schema.workspaces.slug,
      logoUrl: schema.workspaces.logoUrl,
      verifiedAt: schema.workspaces.verifiedAt,
      createdAt: schema.workspaces.createdAt,
      ownerName: schema.users.displayName,
      ownerEmail: schema.users.email,
      memberCount: sql<number>`(select count(*) from ${schema.workspaceMembers} where ${schema.workspaceMembers.workspaceId} = ${schema.workspaces.id})`,
    })
    .from(schema.workspaces)
    .innerJoin(schema.users, eq(schema.users.id, schema.workspaces.ownerId))
    .orderBy(desc(schema.workspaces.createdAt));

  return rows;
}

export async function setWorkspaceVerified(workspaceId: string, verified: boolean) {
  const db = await getDb();
  await db
    .update(schema.workspaces)
    .set({ verifiedAt: verified ? new Date() : null })
    .where(eq(schema.workspaces.id, workspaceId));
}

/** Permanently deletes a workspace and everything in it (relies on ON DELETE CASCADE). */
export async function deleteWorkspace(workspaceId: string) {
  const db = await getDb();
  await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceId));
}
