import "server-only";
import { and, asc, eq, like, or } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface ListKbArticlesOptions {
  q?: string;
  /** Include drafts — only for admin contexts. */
  includeUnpublished?: boolean;
}

export async function listKbArticles(workspaceId: string, options: ListKbArticlesOptions = {}) {
  const db = await getDb();
  const conditions = [eq(schema.kbArticles.workspaceId, workspaceId)];

  if (!options.includeUnpublished) {
    conditions.push(eq(schema.kbArticles.status, "published"));
  }
  if (options.q) {
    const like_ = `%${options.q}%`;
    conditions.push(or(like(schema.kbArticles.title, like_), like(schema.kbArticles.content, like_))!);
  }

  return db.query.kbArticles.findMany({
    where: and(...conditions),
    orderBy: [asc(schema.kbArticles.title)],
  });
}

export async function getKbArticleBySlug(workspaceId: string, slug: string, options: { includeUnpublished?: boolean } = {}) {
  const db = await getDb();
  const conditions = [eq(schema.kbArticles.workspaceId, workspaceId), eq(schema.kbArticles.slug, slug)];
  if (!options.includeUnpublished) conditions.push(eq(schema.kbArticles.status, "published"));

  return db.query.kbArticles.findFirst({ where: and(...conditions) });
}

export async function getKbArticleById(id: string) {
  const db = await getDb();
  return db.query.kbArticles.findFirst({ where: eq(schema.kbArticles.id, id) });
}
