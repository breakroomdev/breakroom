import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { createPostSchema } from "@/lib/validation/posts";
import { listFeed, getFeedPostById } from "@/lib/services/posts";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const GET = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  const { userId, membership } = await requireWorkspaceContext(params.slug);
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const type = url.searchParams.get("type") as "text" | "image" | "announcement" | "poll" | "schedule" | null;

  const result = await listFeed(membership.workspace.id, userId, cursor ? Number(cursor) : null, type ?? undefined);
  return jsonOk(result);
});

export const POST = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { userId, membership } = await requireWorkspaceContext(params.slug);
  if (membership.member.status !== "active") return jsonError("Account disabled", 403);
  requirePermission(membership, "posts.create");

  const body = createPostSchema.parse(await req.json());
  const db = await getDb();

  if (body.type === "announcement") {
    requirePermission(membership, "posts.moderate");
  }

  const [post] = await db
    .insert(schema.posts)
    .values({
      workspaceId: membership.workspace.id,
      authorId: userId,
      type: body.type,
      content: body.content?.trim() || null,
      commentsEnabled: body.commentsEnabled,
    })
    .returning();

  if (!post) return jsonError("Failed to create post", 500);

  if (body.images?.length) {
    await db.insert(schema.postImages).values(
      body.images.map((img, index) => ({
        postId: post.id,
        url: img.url,
        publicId: img.publicId,
        width: img.width,
        height: img.height,
        position: index,
      }))
    );
  }

  if (body.type === "poll" && body.poll) {
    const [poll] = await db
      .insert(schema.polls)
      .values({
        postId: post.id,
        question: body.poll.question,
        allowMultiple: body.poll.allowMultiple,
        expiresAt: body.poll.expiresAt ? new Date(body.poll.expiresAt) : null,
      })
      .returning();

    if (poll) {
      await db.insert(schema.pollOptions).values(
        body.poll.options.map((text, index) => ({ pollId: poll.id, text, position: index }))
      );
    }
  }

  const result = await getFeedPostById(post.id, userId);
  return jsonOk({ post: result }, 201);
});
