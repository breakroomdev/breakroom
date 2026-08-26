import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { PositionsLocationsManager } from "@/components/admin/positions-locations-manager";

export const metadata = { title: "Manage schedule" };

export default async function AdminSchedulePage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");
  requirePermission(membership, "schedule.manage");

  const db = await getDb();
  const [positions, locations] = await Promise.all([
    db.query.positions.findMany({ where: eq(schema.positions.workspaceId, membership.workspace.id) }),
    db.query.locations.findMany({ where: eq(schema.locations.workspaceId, membership.workspace.id) }),
  ]);

  return <PositionsLocationsManager initialPositions={positions} initialLocations={locations} />;
}
