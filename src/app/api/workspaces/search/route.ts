import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const querySchema = z.object({ q: z.string().min(1).max(60) });

/**
 * Public workspace lookup used by the "find your workspace" search on the
 * login/register pages. Only returns name/slug/logo — never membership,
 * email, or settings data — so it's safe to expose without auth, similar to
 * how Slack lets you look up a workspace by name before signing in.
 */
export const GET = withErrorHandling(async (req: Request) => {
  const limit = rateLimit(`workspace-search:${clientIp(req.headers)}`, 30, 60 * 1000);
  if (!limit.success) return jsonError("Too many requests. Please slow down.", 429);

  const url = new URL(req.url);
  const { q } = querySchema.parse({ q: url.searchParams.get("q") ?? "" });

  const db = await getDb();
  const like = `%${q.toLowerCase()}%`;

  const rows = await db
    .select({ name: schema.workspaces.name, slug: schema.workspaces.slug, logoUrl: schema.workspaces.logoUrl })
    .from(schema.workspaces)
    .where(sql`lower(${schema.workspaces.name}) LIKE ${like} OR lower(${schema.workspaces.slug}) LIKE ${like}`)
    .orderBy(schema.workspaces.name)
    .limit(8);

  return jsonOk({ workspaces: rows });
});
