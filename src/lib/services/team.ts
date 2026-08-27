import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface TeamMember {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  jobTitle: string | null;
  department: string | null;
  pronouns: string | null;
  phone: string | null;
  email: string | null;
  status: "active" | "disabled";
  role: { key: string; name: string };
}

export async function listTeamMembers(workspaceId: string): Promise<TeamMember[]> {
  const db = await getDb();
  const rows = await db
    .select({ member: schema.workspaceMembers, user: schema.users, role: schema.roles })
    .from(schema.workspaceMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.workspaceMembers.userId))
    .innerJoin(schema.roles, eq(schema.roles.id, schema.workspaceMembers.roleId))
    .where(eq(schema.workspaceMembers.workspaceId, workspaceId));

  return rows
    .filter((r) => r.member.status === "active")
    .map((r) => ({
      id: r.user.id,
      displayName: r.user.displayName,
      username: r.user.username,
      avatarUrl: r.user.avatarUrl,
      bio: r.user.bio,
      jobTitle: r.user.jobTitle,
      department: r.user.department,
      pronouns: r.user.pronouns,
      phone: r.user.phone,
      email: r.user.hideEmail ? null : r.user.email,
      status: r.member.status,
      role: { key: r.role.key, name: r.role.name },
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}
