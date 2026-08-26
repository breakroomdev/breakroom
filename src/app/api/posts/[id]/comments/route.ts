import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { loadPostContext } from "@/lib/services/post-context";
import { createCommentSchema } from "@/lib/validation/posts";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";
import { notify } from "@/lib/notifications";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const ctx = await loadPostContext(params.id);
  if (!ctx) return jsonError("Post not found", 404);

  const membership = await getMembership(user.id, ctx.workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);

  const db = await getDb();
  const rows = await db
    .select({ comment: schema.comments, author: schema.users })
    .from(schema.comments)
    .innerJoin(schema.users, eq(schema.users.id, schema.comments.authorId))
    .where(eq(schema.comments.postId, params.id))
    .orderBy(asc(schema.comments.createdAt));

  return jsonOk({
    comments: rows
      .filter((r) => !r.comment.deletedAt)
      .map((r) => ({
        id: r.comment.id,
        content: r.comment.content,
        createdAt: r.comment.createdAt.getTime(),
        author: { id: r.author.id, displayName: r.author.displayName, username: r.author.username, avatarUrl: r.author.avatarUrl },
      })),
  });
});

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const ctx = await loadPostContext(params.id);
  if (!ctx) return jsonError("Post not found", 404);
  if (!ctx.post.commentsEnabled) return jsonError("Comments are disabled on this post", 403);

  const membership = await getMembership(user.id, ctx.workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);

  const { content } = createCommentSchema.parse(await req.json());
  const db = await getDb();

  const [comment] = await db.insert(schema.comments).values({ postId: params.id, authorId: user.id, content }).returning();
  if (!comment) return jsonError("Failed to add comment", 500);

  if (ctx.post.authorId !== user.id) {
    await notify({
      workspaceId: ctx.workspace.id,
      userId: ctx.post.authorId,
      actorId: user.id,
      type: "comment",
      title: `${user.displayName} commented on your post`,
      body: content.slice(0, 140),
      link: `/${ctx.workspace.slug}/feed`,
    });
  }

  return jsonOk(
    {
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.getTime(),
        author: { id: user.id, displayName: user.displayName, username: user.username, avatarUrl: user.avatarUrl },
      },
    },
    201
  );
});
