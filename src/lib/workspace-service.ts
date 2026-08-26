import "server-only";
import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { ROLE_PRESETS } from "@/lib/permissions";
import { slugify } from "@/lib/utils";
import { RESERVED_SLUGS } from "@/lib/constants";

/** Seeds the four default roles (owner/admin/manager/employee) for a new workspace. Idempotent. */
export async function ensureDefaultRoles(workspaceId: string) {
  const db = await getDb();
  const existing = await db.query.roles.findMany({ where: eq(schema.roles.workspaceId, workspaceId) });
  const existingKeys = new Set(existing.map((r) => r.key));

  const toInsert = Object.entries(ROLE_PRESETS)
    .filter(([key]) => !existingKeys.has(key))
    .map(([key, preset]) => ({
      workspaceId,
      key,
      name: preset.name,
      permissions: preset.permissions,
      isSystem: preset.isSystem,
    }));

  if (toInsert.length) {
    await db.insert(schema.roles).values(toInsert);
  }

  return db.query.roles.findMany({ where: eq(schema.roles.workspaceId, workspaceId) });
}

export async function generateUniqueSlug(base: string): Promise<string> {
  const db = await getDb();
  const root = slugify(base) || "workspace";
  let candidate = root;
  let attempt = 0;

  while (true) {
    const existing = RESERVED_SLUGS.has(candidate)
      ? true
      : await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, candidate) });
    if (!existing) return candidate;
    attempt += 1;
    candidate = `${root}-${attempt + 1}`;
  }
}

export async function generateUniqueUsername(base: string): Promise<string> {
  const db = await getDb();
  const root = slugify(base).replace(/-/g, "") || "user";
  let candidate = root;
  let attempt = 0;

  while (true) {
    const existing = await db.query.users.findFirst({ where: eq(schema.users.username, candidate) });
    if (!existing) return candidate;
    attempt += 1;
    candidate = `${root}${attempt + 1}`;
  }
}

interface CreateWorkspaceInput {
  name: string;
  ownerId: string;
  slug?: string;
}

export async function createWorkspace({ name, ownerId, slug }: CreateWorkspaceInput) {
  const db = await getDb();
  const finalSlug = slug ? slug : await generateUniqueSlug(name);

  const [workspace] = await db
    .insert(schema.workspaces)
    .values({ name, slug: finalSlug, ownerId })
    .returning();

  if (!workspace) throw new Error("Failed to create workspace");

  await db.insert(schema.workspaceSettings).values({ workspaceId: workspace.id });

  const roles = await ensureDefaultRoles(workspace.id);
  const ownerRole = roles.find((r) => r.key === "owner");
  if (!ownerRole) throw new Error("Owner role missing after seeding");

  await db.insert(schema.workspaceMembers).values({
    workspaceId: workspace.id,
    userId: ownerId,
    roleId: ownerRole.id,
  });

  return workspace;
}

export async function addMemberToWorkspace(workspaceId: string, userId: string, roleKey = "employee") {
  const db = await getDb();
  const existing = await db.query.workspaceMembers.findFirst({
    where: and(eq(schema.workspaceMembers.workspaceId, workspaceId), eq(schema.workspaceMembers.userId, userId)),
  });
  if (existing) return existing;

  const roles = await ensureDefaultRoles(workspaceId);
  const role = roles.find((r) => r.key === roleKey) ?? roles.find((r) => r.key === "employee");
  if (!role) throw new Error("No role available to assign");

  const [member] = await db
    .insert(schema.workspaceMembers)
    .values({ workspaceId, userId, roleId: role.id })
    .returning();
  return member;
}
