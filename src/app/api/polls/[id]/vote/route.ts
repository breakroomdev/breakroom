import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";
import { getFeedPostById } from "@/lib/services/posts";
import { notify } from "@/lib/notifications";

const voteSchema = z.object({ optionId: z.string().min(1) });

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const db = await getDb();
  const poll = await db.query.polls.findFirst({ where: eq(schema.polls.id, params.id) });
  if (!poll) return jsonError("Poll not found", 404);

  if (poll.expiresAt && poll.expiresAt.getTime() < Date.now()) {
    return jsonError("This poll has closed.", 400);
  }

  const post = await db.query.posts.findFirst({ where: eq(schema.posts.id, poll.postId) });
  if (!post) return jsonError("Post not found", 404);
  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, post.workspaceId) });
  if (!workspace) return jsonError("Workspace not found", 404);

  const membership = await getMembership(user.id, workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);

  const { optionId } = voteSchema.parse(await req.json());
  const option = await db.query.pollOptions.findFirst({ where: and(eq(schema.pollOptions.id, optionId), eq(schema.pollOptions.pollId, poll.id)) });
  if (!option) return jsonError("Invalid poll option", 400);

  const existingForOption = await db.query.pollVotes.findFirst({
    where: and(eq(schema.pollVotes.optionId, optionId), eq(schema.pollVotes.userId, user.id)),
  });

  if (existingForOption) {
    await db.delete(schema.pollVotes).where(eq(schema.pollVotes.id, existingForOption.id));
  } else {
    if (!poll.allowMultiple) {
      const myVotes = await db.query.pollVotes.findMany({ where: and(eq(schema.pollVotes.pollId, poll.id), eq(schema.pollVotes.userId, user.id)) });
      if (myVotes.length) {
        await db.delete(schema.pollVotes).where(and(eq(schema.pollVotes.pollId, poll.id), eq(schema.pollVotes.userId, user.id)));
      }
    }
    await db.insert(schema.pollVotes).values({ pollId: poll.id, optionId, userId: user.id });

    if (post.authorId !== user.id) {
      await notify({
        workspaceId: workspace.id,
        userId: post.authorId,
        actorId: user.id,
        type: "poll_vote",
        title: `${user.displayName} voted on your poll`,
        link: `/${workspace.slug}/polls`,
      });
    }
  }

  const updated = await getFeedPostById(post.id, user.id);
  return jsonOk({ post: updated });
});
