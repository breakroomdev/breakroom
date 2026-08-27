import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { reorderHubLinksSchema } from "@/lib/validation/hub";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const POST = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const { orderedIds } = reorderHubLinksSchema.parse(await req.json());
  const db = await getDb();

  const owned = await db.query.hubLinks.findMany({
    where: and(eq(schema.hubLinks.workspaceId, membership.workspace.id), inArray(schema.hubLinks.id, orderedIds)),
  });
  const ownedIds = new Set(owned.map((l) => l.id));
  if (owned.length !== orderedIds.length) return jsonError("Some links weren't found in this workspace.", 400);

  await Promise.all(
    orderedIds.map((id, index) => (ownedIds.has(id) ? db.update(schema.hubLinks).set({ position: index }).where(eq(schema.hubLinks.id, id)) : null))
  );

  return jsonOk({ success: true });
});
