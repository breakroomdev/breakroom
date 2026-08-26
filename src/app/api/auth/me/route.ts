import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) return jsonOk({ user: null, workspaces: [] });

  const db = await getDb();
  const memberships = await db
    .select({ workspace: schema.workspaces, role: schema.roles })
    .from(schema.workspaceMembers)
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.workspaceMembers.workspaceId))
    .innerJoin(schema.roles, eq(schema.roles.id, schema.workspaceMembers.roleId))
    .where(eq(schema.workspaceMembers.userId, user.id));

  return jsonOk({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      colorMode: user.colorMode,
      themeOverride: user.themeOverride,
      isSiteAdmin: user.isSiteAdmin,
    },
    workspaces: memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      logoUrl: m.workspace.logoUrl,
      theme: m.workspace.theme,
      role: m.role.key,
    })),
  });
});
