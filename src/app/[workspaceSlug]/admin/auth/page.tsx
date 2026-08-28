import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { AuthSettingsForm } from "@/components/admin/auth-settings-form";

export const metadata = { title: "Authentication settings" };

export default async function AdminAuthPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");
  requirePermission(membership, "workspace.manage");

  const db = await getDb();
  const settings = await db.query.workspaceSettings.findFirst({ where: eq(schema.workspaceSettings.workspaceId, membership.workspace.id) });

  return (
    <AuthSettingsForm
      initial={{
        authPasswordEnabled: settings?.authPasswordEnabled ?? true,
        authDiscordEnabled: settings?.authDiscordEnabled ?? false,
        allowSelfRegistration: settings?.allowSelfRegistration ?? true,
      }}
    />
  );
}
