import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { loadPostContext } from "@/lib/services/post-context";
import { reactionSchema } from "@/lib/validation/posts";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";
import { notify } from "@/lib/notifications";

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const ctx = await loadPostContext(params.id);
  if (!ctx) return jsonError("Post not found", 404);

  const membership = await getMembership(user.id, ctx.workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);

  const { emoji } = reactionSchema.parse(await req.json());
  const db = await getDb();

  const existing = await db.query.reactions.findFirst({
    where: and(eq(schema.reactions.postId, params.id), eq(schema.reactions.userId, user.id)),
  });

  if (existing && existing.emoji === emoji) {
    await db.delete(schema.reactions).where(eq(schema.reactions.id, existing.id));
    return jsonOk({ reacted: false });
  }

  if (existing) {
    await db.update(schema.reactions).set({ emoji }).where(eq(schema.reactions.id, existing.id));
  } else {
    await db.insert(schema.reactions).values({ postId: params.id, userId: user.id, emoji });
  }

  if (ctx.post.authorId !== user.id) {
    await notify({
      workspaceId: ctx.workspace.id,
      userId: ctx.post.authorId,
      actorId: user.id,
      type: "reaction",
      title: `${user.displayName} reacted ${emoji} to your post`,
      link: `/${ctx.workspace.slug}/feed`,
    });
  }

  return jsonOk({ reacted: true, emoji });
});
