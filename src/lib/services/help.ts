import "server-only";
import { and, asc, count, eq, isNull, like, or } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface ListHelpArticlesOptions {
  q?: string;
  /** Pass a string to filter to that category, or null to filter to uncategorized articles. Omit to not filter by category at all. */
  category?: string | null;
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
  if (options.category !== undefined) {
    conditions.push(options.category === null ? isNull(schema.helpArticles.category) : eq(schema.helpArticles.category, options.category));
  }

  return db.query.helpArticles.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [asc(schema.helpArticles.title)],
  });
}

export interface HelpCategorySummary {
  category: string | null;
  count: number;
}

/** Distinct categories (published articles only) with their article counts, for the category-browse index. */
export async function listHelpCategories(): Promise<HelpCategorySummary[]> {
  const db = await getDb();
  const rows = await db
    .select({ category: schema.helpArticles.category, value: count() })
    .from(schema.helpArticles)
    .where(eq(schema.helpArticles.status, "published"))
    .groupBy(schema.helpArticles.category);

  const summaries = rows.map((r) => ({ category: r.category, count: r.value }));
  return summaries.sort((a, b) => {
    if (a.category === null) return 1;
    if (b.category === null) return -1;
    return a.category.localeCompare(b.category);
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
