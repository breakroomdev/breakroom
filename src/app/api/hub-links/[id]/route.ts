import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { updateHubLinkSchema } from "@/lib/validation/hub";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

async function loadContext(linkId: string) {
  const db = await getDb();
  const link = await db.query.hubLinks.findFirst({ where: eq(schema.hubLinks.id, linkId) });
  if (!link) return null;
  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, link.workspaceId) });
  if (!workspace) return null;
  return { link, workspace };
}

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const ctx = await loadContext(params.id);
  if (!ctx) return jsonError("Link not found", 404);

  const membership = await getMembership(user.id, ctx.workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);
  requirePermission(membership, "workspace.manage");

  const body = updateHubLinkSchema.parse(await req.json());
  const db = await getDb();

  const [updated] = await db
    .update(schema.hubLinks)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(schema.hubLinks.id, ctx.link.id))
    .returning();

  return jsonOk({ link: updated });
});

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const ctx = await loadContext(params.id);
  if (!ctx) return jsonError("Link not found", 404);

  const membership = await getMembership(user.id, ctx.workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);
  requirePermission(membership, "workspace.manage");

  const db = await getDb();
  await db.delete(schema.hubLinks).where(eq(schema.hubLinks.id, ctx.link.id));

  return jsonOk({ success: true });
});
