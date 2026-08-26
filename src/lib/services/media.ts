import "server-only";
import { desc, eq, lt, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface MediaItem {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  postId: string;
  createdAt: number;
  author: { displayName: string; avatarUrl: string | null };
}

const PAGE_SIZE = 24;

export async function listMedia(workspaceId: string, cursor?: number | null): Promise<{ items: MediaItem[]; nextCursor: number | null }> {
  const db = await getDb();

  const where = cursor
    ? and(eq(schema.posts.workspaceId, workspaceId), lt(schema.posts.createdAt, new Date(cursor)))
    : eq(schema.posts.workspaceId, workspaceId);

  const rows = await db
    .select({ image: schema.postImages, post: schema.posts, author: schema.users })
    .from(schema.postImages)
    .innerJoin(schema.posts, eq(schema.posts.id, schema.postImages.postId))
    .innerJoin(schema.users, eq(schema.users.id, schema.posts.authorId))
    .where(where)
    .orderBy(desc(schema.posts.createdAt))
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const page = rows.slice(0, PAGE_SIZE);

  return {
    items: page.map((r) => ({
      id: r.image.id,
      url: r.image.url,
      width: r.image.width,
      height: r.image.height,
      postId: r.post.id,
      createdAt: r.post.createdAt.getTime(),
      author: { displayName: r.author.displayName, avatarUrl: r.author.avatarUrl },
    })),
    nextCursor: hasMore ? page[page.length - 1]!.post.createdAt.getTime() : null,
  };
}
