import "server-only";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { RESERVED_SLUGS } from "@/lib/constants";

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

/** Changes a workspace's slug (its subdomain/URL). Throws with a user-facing message if invalid or taken. */
export async function changeWorkspaceSlug(workspaceId: string, slug: string): Promise<void> {
  const db = await getDb();

  if (RESERVED_SLUGS.has(slug)) {
    throw new Error("That workspace URL is reserved. Please choose another.");
  }
  const taken = await db.query.workspaces.findFirst({
    where: and(eq(schema.workspaces.slug, slug), ne(schema.workspaces.id, workspaceId)),
  });
  if (taken) {
    throw new Error("That workspace URL is already taken.");
  }

  await db.update(schema.workspaces).set({ slug, updatedAt: new Date() }).where(eq(schema.workspaces.id, workspaceId));
}

/** Permanently deletes a workspace and everything in it (relies on ON DELETE CASCADE). */
export async function deleteWorkspace(workspaceId: string) {
  const db = await getDb();
  await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceId));
}
