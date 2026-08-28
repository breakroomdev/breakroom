import { and, eq, ne } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission, ForbiddenError } from "@/lib/auth/authorize";
import { updateWorkspaceSchema } from "@/lib/validation/workspace";
import { RESERVED_SLUGS } from "@/lib/constants";
import { deleteWorkspace } from "@/lib/services/staff";
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

  if (body.slug && body.slug !== membership.workspace.slug) {
    if (RESERVED_SLUGS.has(body.slug)) {
      return jsonError("That workspace URL is reserved. Please choose another.", 409);
    }
    const taken = await db.query.workspaces.findFirst({
      where: and(eq(schema.workspaces.slug, body.slug), ne(schema.workspaces.id, membership.workspace.id)),
    });
    if (taken) {
      return jsonError("That workspace URL is already taken.", 409);
    }
  }

  const [updated] = await db
    .update(schema.workspaces)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(schema.workspaces.id, membership.workspace.id))
    .returning();

  return jsonOk({ workspace: updated });
});

/** Permanently deletes the workspace and everything in it. Owner-only — even an Admin with workspace.manage can't do this. */
export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  if (membership.member.userId !== membership.workspace.ownerId) {
    throw new ForbiddenError("Only the workspace owner can delete this workspace.");
  }

  await deleteWorkspace(membership.workspace.id);

  return jsonOk({ success: true });
});
