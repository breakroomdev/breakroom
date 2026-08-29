import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function loadKbArticleContext(articleId: string) {
  const db = await getDb();
  const article = await db.query.kbArticles.findFirst({ where: eq(schema.kbArticles.id, articleId) });
  if (!article) return null;
  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, article.workspaceId) });
  if (!workspace) return null;
  return { article, workspace };
}
