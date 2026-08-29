import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, ForbiddenError } from "@/lib/auth/authorize";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const db = await getDb();
  const comment = await db.query.comments.findFirst({ where: eq(schema.comments.id, params.id) });
  if (!comment || !comment.kbArticleId) return jsonError("Comment not found", 404);

  const article = await db.query.kbArticles.findFirst({ where: eq(schema.kbArticles.id, comment.kbArticleId) });
  if (!article) return jsonError("Article not found", 404);
  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, article.workspaceId) });
  if (!workspace) return jsonError("Workspace not found", 404);

  const membership = await getMembership(user.id, workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);

  const isAuthor = comment.authorId === user.id;
  const canModerate = membership.role.permissions.includes("comments.moderate");
  if (!isAuthor && !canModerate) throw new ForbiddenError("Only the author or a moderator can delete this comment");

  await db.update(schema.comments).set({ deletedAt: new Date(), content: "" }).where(eq(schema.comments.id, comment.id));

  return jsonOk({ success: true });
});
