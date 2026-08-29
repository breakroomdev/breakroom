import "server-only";
import { and, asc, count, eq, isNull, like, or } from "drizzle-orm";
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
