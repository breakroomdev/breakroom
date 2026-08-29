import "server-only";
import { and, asc, eq, like, or } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface ListHelpArticlesOptions {
  q?: string;
  /** Include drafts — only for staff/admin contexts. */
  includeUnpublished?: boolean;
}

export async function listHelpArticles(options: ListHelpArticlesOptions = {}) {
  const db = await getDb();
  const conditions = [];

  if (!options.includeUnpublished) {
    conditions.push(eq(schema.helpArticles.status, "published"));
  }
  if (options.q) {
    const like_ = `%${options.q}%`;
    conditions.push(or(like(schema.helpArticles.title, like_), like(schema.helpArticles.content, like_))!);
  }

  return db.query.helpArticles.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [asc(schema.helpArticles.title)],
  });
}

export async function getHelpArticleBySlug(slug: string, options: { includeUnpublished?: boolean } = {}) {
  const db = await getDb();
  const conditions = [eq(schema.helpArticles.slug, slug)];
  if (!options.includeUnpublished) conditions.push(eq(schema.helpArticles.status, "published"));

  return db.query.helpArticles.findFirst({ where: and(...conditions) });
}

export async function getHelpArticleById(id: string) {
  const db = await getDb();
  return db.query.helpArticles.findFirst({ where: eq(schema.helpArticles.id, id) });
}
