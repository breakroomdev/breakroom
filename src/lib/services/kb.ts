import "server-only";
import { and, asc, count, eq, isNull, like, or } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface ListKbArticlesOptions {
  q?: string;
  /** Pass a string to filter to that category, or null to filter to uncategorized articles. Omit to not filter by category at all. */
  category?: string | null;
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
  if (options.category !== undefined) {
    conditions.push(options.category === null ? isNull(schema.kbArticles.category) : eq(schema.kbArticles.category, options.category));
  }

  return db.query.kbArticles.findMany({
    where: and(...conditions),
    orderBy: [asc(schema.kbArticles.title)],
  });
}

export interface KbCategorySummary {
  category: string | null;
  count: number;
}

/** Distinct categories (published articles only) with their article counts, for the category-browse index. */
export async function listKbCategories(workspaceId: string): Promise<KbCategorySummary[]> {
  const db = await getDb();
  const rows = await db
    .select({ category: schema.kbArticles.category, value: count() })
    .from(schema.kbArticles)
    .where(and(eq(schema.kbArticles.workspaceId, workspaceId), eq(schema.kbArticles.status, "published")))
    .groupBy(schema.kbArticles.category);

  const summaries = rows.map((r) => ({ category: r.category, count: r.value }));
  // Alphabetical, with the uncategorized bucket (category: null) always last.
  return summaries.sort((a, b) => {
    if (a.category === null) return 1;
    if (b.category === null) return -1;
    return a.category.localeCompare(b.category);
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

export interface KbArticleEngagement {
  commentCount: number;
  reactionCount: number;
  reactedByMe: boolean;
  reactionSummary: { emoji: string; count: number }[];
}

export async function getKbArticleEngagement(articleId: string, userId: string): Promise<KbArticleEngagement> {
  const db = await getDb();

  const [commentCountRows, reactionRows, myReaction] = await Promise.all([
    db
      .select({ value: count() })
      .from(schema.comments)
      .where(and(eq(schema.comments.kbArticleId, articleId), isNull(schema.comments.deletedAt))),
    db
      .select({ emoji: schema.reactions.emoji, value: count() })
      .from(schema.reactions)
      .where(eq(schema.reactions.kbArticleId, articleId))
      .groupBy(schema.reactions.emoji),
    db.query.reactions.findFirst({ where: and(eq(schema.reactions.kbArticleId, articleId), eq(schema.reactions.userId, userId)) }),
  ]);

  const reactionSummary = reactionRows.map((r) => ({ emoji: r.emoji, count: r.value }));

  return {
    commentCount: commentCountRows[0]?.value ?? 0,
    reactionCount: reactionSummary.reduce((sum, r) => sum + r.count, 0),
    reactedByMe: !!myReaction,
    reactionSummary,
  };
}
