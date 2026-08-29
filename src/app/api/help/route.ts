import { listHelpArticles } from "@/lib/services/help";
import { jsonOk, jsonError, withErrorHandling } from "@/lib/api/response";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/** Public, unauthenticated — powers the help center's search-as-you-type. */
export const GET = withErrorHandling(async (req: Request) => {
  const limit = rateLimit(`help-search:${clientIp(req.headers)}`, 30, 60 * 1000);
  if (!limit.success) return jsonError("Too many requests. Please slow down.", 429);

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;

  const articles = await listHelpArticles({ q });
  return jsonOk({ articles });
});
