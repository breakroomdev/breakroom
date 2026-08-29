import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { kbArticleSchema } from "@/lib/validation/kb";
import { listKbArticles } from "@/lib/services/kb";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const GET = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  const canManage = membership.role.permissions.includes("workspace.manage");

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;

  const articles = await listKbArticles(membership.workspace.id, { q, includeUnpublished: canManage });
  return jsonOk({ articles });
});

export const POST = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { userId, membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const body = kbArticleSchema.parse(await req.json());
  const db = await getDb();

  const taken = await db.query.kbArticles.findFirst({
    where: and(eq(schema.kbArticles.workspaceId, membership.workspace.id), eq(schema.kbArticles.slug, body.slug)),
  });
  if (taken) return jsonError("An article with that URL already exists.", 409);

  const [article] = await db
    .insert(schema.kbArticles)
    .values({
      workspaceId: membership.workspace.id,
      title: body.title,
      slug: body.slug,
      content: body.content,
      category: body.category,
      status: body.status ?? "published",
      createdBy: userId,
    })
    .returning();

  return jsonOk({ article }, 201);
});
