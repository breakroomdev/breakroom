import "server-only";
import { and, count, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface FeedPost {
  id: string;
  type: string;
  content: string | null;
  isPinned: boolean;
  commentsEnabled: boolean;
  createdAt: number;
  editedAt: number | null;
  author: { id: string; displayName: string; username: string; avatarUrl: string | null; jobTitle: string | null };
  images: { id: string; url: string; width: number | null; height: number | null }[];
  commentCount: number;
  reactionCount: number;
  reactedByMe: boolean;
  reactionSummary: { emoji: string; count: number }[];
  poll: {
    id: string;
    question: string;
    allowMultiple: boolean;
    expiresAt: number | null;
    totalVotes: number;
    myVotes: string[];
    options: { id: string; text: string; votes: number }[];
  } | null;
}

const PAGE_SIZE = 15;

type PostRow = { post: typeof schema.posts.$inferSelect; author: typeof schema.users.$inferSelect };

async function assemblePosts(page: PostRow[], userId: string): Promise<FeedPost[]> {
  const db = await getDb();
  const postIds = page.map((r) => r.post.id);
  if (postIds.length === 0) return [];

  const [images, commentCounts, reactionRows, myReactions, polls] = await Promise.all([
    db.select().from(schema.postImages).where(inArray(schema.postImages.postId, postIds)),
    db
      .select({ postId: schema.comments.postId, value: count() })
      .from(schema.comments)
      .where(and(inArray(schema.comments.postId, postIds), sql`${schema.comments.deletedAt} is null`))
      .groupBy(schema.comments.postId),
    db
      .select({ postId: schema.reactions.postId, emoji: schema.reactions.emoji, value: count() })
      .from(schema.reactions)
      .where(inArray(schema.reactions.postId, postIds))
      .groupBy(schema.reactions.postId, schema.reactions.emoji),
    db.select().from(schema.reactions).where(and(inArray(schema.reactions.postId, postIds), eq(schema.reactions.userId, userId))),
    db.select().from(schema.polls).where(inArray(schema.polls.postId, postIds)),
  ]);

  const pollIds = polls.map((p) => p.id);
  const [options, votes] = pollIds.length
    ? await Promise.all([
        db.select().from(schema.pollOptions).where(inArray(schema.pollOptions.pollId, pollIds)),
        db.select().from(schema.pollVotes).where(inArray(schema.pollVotes.pollId, pollIds)),
      ])
    : [[], []];

  return page.map(({ post, author }) => {
    const postImages = images.filter((i) => i.postId === post.id).sort((a, b) => a.position - b.position);
    const commentCount = commentCounts.find((c) => c.postId === post.id)?.value ?? 0;
    const summary = reactionRows.filter((r) => r.postId === post.id).map((r) => ({ emoji: r.emoji, count: r.value }));
    const reactionCount = summary.reduce((sum, r) => sum + r.count, 0);
    const reactedByMe = myReactions.some((r) => r.postId === post.id);

    const poll = polls.find((p) => p.postId === post.id);
    let pollData: FeedPost["poll"] = null;
    if (poll) {
      const pollOptions = options.filter((o) => o.pollId === poll.id).sort((a, b) => a.position - b.position);
      const pollVotes = votes.filter((v) => v.pollId === poll.id);
      pollData = {
        id: poll.id,
        question: poll.question,
        allowMultiple: poll.allowMultiple,
        expiresAt: poll.expiresAt ? poll.expiresAt.getTime() : null,
        totalVotes: new Set(pollVotes.map((v) => v.userId)).size,
        myVotes: pollVotes.filter((v) => v.userId === userId).map((v) => v.optionId),
        options: pollOptions.map((o) => ({ id: o.id, text: o.text, votes: pollVotes.filter((v) => v.optionId === o.id).length })),
      };
    }

    return {
      id: post.id,
      type: post.type,
      content: post.content,
      isPinned: post.isPinned,
      commentsEnabled: post.commentsEnabled,
      createdAt: post.createdAt.getTime(),
      editedAt: post.editedAt ? post.editedAt.getTime() : null,
      author: { id: author.id, displayName: author.displayName, username: author.username, avatarUrl: author.avatarUrl, jobTitle: author.jobTitle },
      images: postImages.map((i) => ({ id: i.id, url: i.url, width: i.width, height: i.height })),
      commentCount,
      reactionCount,
      reactedByMe,
      reactionSummary: summary,
      poll: pollData,
    };
  });
}

export async function listFeed(
  workspaceId: string,
  userId: string,
  cursor?: number | null,
  type?: "text" | "image" | "announcement" | "poll" | "schedule"
): Promise<{ posts: FeedPost[]; nextCursor: number | null }> {
  const db = await getDb();

  const conditions = [eq(schema.posts.workspaceId, workspaceId)];
  if (cursor) conditions.push(lt(schema.posts.createdAt, new Date(cursor)));
  if (type) conditions.push(eq(schema.posts.type, type));
  const baseWhere = and(...conditions);

  const rows = await db
    .select({ post: schema.posts, author: schema.users })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.users.id, schema.posts.authorId))
    .where(baseWhere)
    .orderBy(desc(schema.posts.isPinned), desc(schema.posts.createdAt))
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const page = rows.slice(0, PAGE_SIZE);

  const posts = await assemblePosts(page, userId);
  return { posts, nextCursor: hasMore ? page[page.length - 1]!.post.createdAt.getTime() : null };
}

export async function getFeedPostById(postId: string, userId: string): Promise<FeedPost | null> {
  const db = await getDb();
  const rows = await db
    .select({ post: schema.posts, author: schema.users })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.users.id, schema.posts.authorId))
    .where(eq(schema.posts.id, postId))
    .limit(1);

  if (!rows[0]) return null;
  const posts = await assemblePosts(rows, userId);
  return posts[0] ?? null;
}
