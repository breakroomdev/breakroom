import "server-only";
import { and, desc, eq, gte, like, lt, lte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { recordIntegrationSuccess } from "@/lib/services/integrations";

interface RecordChatMessageInput {
  workspaceId: string;
  integrationId: string;
  universeId: string;
  placeId: string;
  jobId: string;
  userId: number;
  username: string;
  displayName: string;
  message: string;
  timestamp: Date;
}

export async function recordRobloxChatMessage(input: RecordChatMessageInput) {
  const db = await getDb();
  const [row] = await db.insert(schema.robloxChatMessages).values(input).returning();
  await recordIntegrationSuccess(input.integrationId);
  return row;
}

export interface RobloxMessageFilters {
  q?: string;
  username?: string;
  jobId?: string;
  from?: Date;
  to?: Date;
  cursor?: number | null;
  limit?: number;
}

export async function listRobloxMessages(integrationId: string, filters: RobloxMessageFilters) {
  const db = await getDb();
  const limit = filters.limit ?? 30;

  const conditions = [eq(schema.robloxChatMessages.integrationId, integrationId)];
  if (filters.cursor) conditions.push(lt(schema.robloxChatMessages.timestamp, new Date(filters.cursor)));
  if (filters.q) conditions.push(like(schema.robloxChatMessages.message, `%${filters.q}%`));
  if (filters.username) conditions.push(like(schema.robloxChatMessages.username, `%${filters.username}%`));
  if (filters.jobId) conditions.push(eq(schema.robloxChatMessages.jobId, filters.jobId));
  if (filters.from) conditions.push(gte(schema.robloxChatMessages.timestamp, filters.from));
  if (filters.to) conditions.push(lte(schema.robloxChatMessages.timestamp, filters.to));

  const rows = await db
    .select()
    .from(schema.robloxChatMessages)
    .where(and(...conditions))
    .orderBy(desc(schema.robloxChatMessages.timestamp))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1]!.timestamp.getTime() : null;

  return { messages: page, nextCursor };
}

/** Messages newer than `since` — used by the live viewer's poll loop. */
export async function listNewRobloxMessages(integrationId: string, since: Date) {
  const db = await getDb();
  return db
    .select()
    .from(schema.robloxChatMessages)
    .where(and(eq(schema.robloxChatMessages.integrationId, integrationId), gte(schema.robloxChatMessages.timestamp, since)))
    .orderBy(desc(schema.robloxChatMessages.timestamp))
    .limit(100);
}

const PROFILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface RobloxProfile {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

/** Fetches a Roblox user's profile + avatar, using a cached row when fresh enough. */
export async function getRobloxProfile(userId: number, fallback: { username: string; displayName: string }): Promise<RobloxProfile> {
  const db = await getDb();
  const cached = await db.query.robloxProfileCache.findFirst({ where: eq(schema.robloxProfileCache.userId, userId) });

  if (cached && Date.now() - cached.fetchedAt.getTime() < PROFILE_CACHE_TTL_MS) {
    return { userId, username: cached.username, displayName: cached.displayName, avatarUrl: cached.avatarUrl };
  }

  try {
    const [userRes, thumbRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${userId}`, { signal: AbortSignal.timeout(5000) }),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`, {
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    const userData = userRes.ok ? await userRes.json() : null;
    const thumbData = thumbRes.ok ? await thumbRes.json() : null;

    const profile: RobloxProfile = {
      userId,
      username: userData?.name ?? fallback.username,
      displayName: userData?.displayName ?? fallback.displayName,
      avatarUrl: thumbData?.data?.[0]?.imageUrl ?? null,
    };

    await db
      .insert(schema.robloxProfileCache)
      .values({ userId, username: profile.username, displayName: profile.displayName, avatarUrl: profile.avatarUrl, fetchedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.robloxProfileCache.userId,
        set: { username: profile.username, displayName: profile.displayName, avatarUrl: profile.avatarUrl, fetchedAt: new Date() },
      });

    return profile;
  } catch {
    // Roblox's API is unreachable — fall back to a stale cache entry, or the values from the message itself.
    if (cached) return { userId, username: cached.username, displayName: cached.displayName, avatarUrl: cached.avatarUrl };
    return { userId, username: fallback.username, displayName: fallback.displayName, avatarUrl: null };
  }
}
