import { and, eq, ne } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { requireSiteAdmin } from "@/lib/auth/authorize";
import { updateHelpArticleSchema } from "@/lib/validation/help";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  requireSiteAdmin(user);

  const existing = await (await getDb()).query.helpArticles.findFirst({ where: eq(schema.helpArticles.id, params.id) });
  if (!existing) return jsonError("Article not found", 404);

  const body = updateHelpArticleSchema.parse(await req.json());
  const db = await getDb();

  if (body.slug && body.slug !== existing.slug) {
    const taken = await db.query.helpArticles.findFirst({
      where: and(eq(schema.helpArticles.slug, body.slug), ne(schema.helpArticles.id, existing.id)),
    });
    if (taken) return jsonError("An article with that URL already exists.", 409);
  }

  const [updated] = await db
    .update(schema.helpArticles)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(schema.helpArticles.id, existing.id))
    .returning();

  return jsonOk({ article: updated });
});

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  requireSiteAdmin(user);

  const db = await getDb();
  const existing = await db.query.helpArticles.findFirst({ where: eq(schema.helpArticles.id, params.id) });
  if (!existing) return jsonError("Article not found", 404);

  await db.delete(schema.helpArticles).where(eq(schema.helpArticles.id, existing.id));

  return jsonOk({ success: true });
});
