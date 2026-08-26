import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { updateWorkspaceSchema } from "@/lib/validation/workspace";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { slug: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  return jsonOk({ workspace: membership.workspace });
});

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const body = updateWorkspaceSchema.parse(await req.json());
  const db = await getDb();

  const [updated] = await db
    .update(schema.workspaces)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(schema.workspaces.id, membership.workspace.id))
    .returning();

  return jsonOk({ workspace: updated });
});
