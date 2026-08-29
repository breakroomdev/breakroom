import { getDb, schema } from "@/lib/db";
import { authenticateApiApp } from "@/lib/api/public-auth";
import { recordIntegrationSuccess, recordIntegrationError } from "@/lib/services/integrations";
import { createPostSchema } from "@/lib/validation/posts";
import { listFeed, getFeedPostById } from "@/lib/services/posts";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";

const CREATABLE_TYPES = ["text", "image"] as const;

export const GET = withErrorHandling(async (req: Request) => {
  const auth = await authenticateApiApp(req);
  if ("error" in auth) return auth.error;
  const { app } = auth;

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");

  const result = await listFeed(app.workspaceId, app.createdBy, cursor ? Number(cursor) : null);
  await recordIntegrationSuccess(app.id);
  return jsonOk(result);
});

export const POST = withErrorHandling(async (req: Request) => {
  const auth = await authenticateApiApp(req);
  if ("error" in auth) return auth.error;
  const { app } = auth;

  const body = createPostSchema.parse(await req.json());

  if (!CREATABLE_TYPES.includes(body.type as (typeof CREATABLE_TYPES)[number])) {
    await recordIntegrationError(app.id, `Rejected post type "${body.type}" — the public API only supports text/image posts.`);
    return jsonError('Only "text" and "image" posts can be created via the API.', 422);
  }

  const db = await getDb();
  const [post] = await db
    .insert(schema.posts)
    .values({
      workspaceId: app.workspaceId,
      authorId: app.createdBy,
      type: body.type,
      content: body.content?.trim() || null,
      commentsEnabled: body.commentsEnabled,
    })
    .returning();

  if (!post) {
    await recordIntegrationError(app.id, "Failed to create post");
    return jsonError("Failed to create post", 500);
  }

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

  const result = await getFeedPostById(post.id, app.createdBy);
  await recordIntegrationSuccess(app.id);
  return jsonOk({ post: result }, 201);
});
