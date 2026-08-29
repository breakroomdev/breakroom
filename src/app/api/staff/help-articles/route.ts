import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { requireSiteAdmin } from "@/lib/auth/authorize";
import { helpArticleSchema } from "@/lib/validation/help";
import { listHelpArticles } from "@/lib/services/help";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  requireSiteAdmin(user);

  const articles = await listHelpArticles({ includeUnpublished: true });
  return jsonOk({ articles });
});

export const POST = withErrorHandling(async (req: Request) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  requireSiteAdmin(user);

  const body = helpArticleSchema.parse(await req.json());
  const db = await getDb();

  const taken = await db.query.helpArticles.findFirst({ where: eq(schema.helpArticles.slug, body.slug) });
  if (taken) return jsonError("An article with that URL already exists.", 409);

  const [article] = await db
    .insert(schema.helpArticles)
    .values({
      title: body.title,
      slug: body.slug,
      content: body.content,
      category: body.category,
      status: body.status ?? "published",
      createdBy: user.id,
    })
    .returning();

  return jsonOk({ article }, 201);
});
