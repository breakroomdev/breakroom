import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function loadPostContext(postId: string) {
  const db = await getDb();
  const post = await db.query.posts.findFirst({ where: eq(schema.posts.id, postId) });
  if (!post) return null;
  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, post.workspaceId) });
  if (!workspace) return null;
  return { post, workspace };
}
