import { and, eq, ne } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { updateKbArticleSchema } from "@/lib/validation/kb";
import { loadKbArticleContext } from "@/lib/services/kb-context";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const ctx = await loadKbArticleContext(params.id);
  if (!ctx) return jsonError("Article not found", 404);

  const membership = await getMembership(user.id, ctx.workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);
  requirePermission(membership, "workspace.manage");

  const body = updateKbArticleSchema.parse(await req.json());
  const db = await getDb();

  if (body.slug && body.slug !== ctx.article.slug) {
    const taken = await db.query.kbArticles.findFirst({
      where: and(eq(schema.kbArticles.workspaceId, ctx.workspace.id), eq(schema.kbArticles.slug, body.slug), ne(schema.kbArticles.id, ctx.article.id)),
    });
    if (taken) return jsonError("An article with that URL already exists.", 409);
  }

  const [updated] = await db
    .update(schema.kbArticles)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(schema.kbArticles.id, ctx.article.id))
    .returning();

  return jsonOk({ article: updated });
});

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const ctx = await loadKbArticleContext(params.id);
  if (!ctx) return jsonError("Article not found", 404);

  const membership = await getMembership(user.id, ctx.workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);
  requirePermission(membership, "workspace.manage");

  const db = await getDb();
  await db.delete(schema.kbArticles).where(eq(schema.kbArticles.id, ctx.article.id));

  return jsonOk({ success: true });
});
