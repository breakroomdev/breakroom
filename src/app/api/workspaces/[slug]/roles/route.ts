import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { jsonOk, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { slug: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "roles.manage");

  const db = await getDb();
  const roles = await db.query.roles.findMany({ where: eq(schema.roles.workspaceId, membership.workspace.id) });
  return jsonOk({ roles });
});
