import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission, ForbiddenError } from "@/lib/auth/authorize";
import { updatePostSchema } from "@/lib/validation/posts";
import { getFeedPostById } from "@/lib/services/posts";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";
import { notify } from "@/lib/notifications";
import { loadPostContext } from "@/lib/services/post-context";

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const ctx = await loadPostContext(params.id);
  if (!ctx?.workspace) return jsonError("Post not found", 404);

  const membership = await getMembership(user.id, ctx.workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);

  const body = updatePostSchema.parse(await req.json());
  const isAuthor = ctx.post.authorId === user.id;
  const canModerate = membership.role.permissions.includes("posts.moderate");

  const db = await getDb();

  if (body.content !== undefined || body.commentsEnabled !== undefined) {
    if (!isAuthor && !canModerate) throw new ForbiddenError("Only the author or a moderator can edit this post");
    await db
      .update(schema.posts)
      .set({
        ...(body.content !== undefined ? { content: body.content, editedAt: new Date() } : {}),
        ...(body.commentsEnabled !== undefined ? { commentsEnabled: body.commentsEnabled } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.posts.id, ctx.post.id));
  }

  if (body.isPinned !== undefined) {
    requirePermission(membership, "posts.moderate");
    await db.update(schema.posts).set({ isPinned: body.isPinned, updatedAt: new Date() }).where(eq(schema.posts.id, ctx.post.id));
    if (body.isPinned && ctx.post.authorId !== user.id) {
      await notify({
        workspaceId: ctx.workspace.id,
        userId: ctx.post.authorId,
        actorId: user.id,
        type: "post_pinned",
        title: `${user.displayName} pinned your post`,
        link: `/${ctx.workspace.slug}/feed`,
      });
    }
  }

  const updated = await getFeedPostById(ctx.post.id, user.id);
  return jsonOk({ post: updated });
});

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const ctx = await loadPostContext(params.id);
  if (!ctx?.workspace) return jsonError("Post not found", 404);

  const membership = await getMembership(user.id, ctx.workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);

  const isAuthor = ctx.post.authorId === user.id;
  const canModerate = membership.role.permissions.includes("posts.moderate");
  if (!isAuthor && !canModerate) throw new ForbiddenError("Only the author or a moderator can delete this post");

  const db = await getDb();
  await db.delete(schema.posts).where(eq(schema.posts.id, ctx.post.id));

  return jsonOk({ success: true });
});
