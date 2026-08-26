import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { loadPostContext } from "@/lib/services/post-context";
import { reportSchema } from "@/lib/validation/posts";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const ctx = await loadPostContext(params.id);
  if (!ctx) return jsonError("Post not found", 404);

  const membership = await getMembership(user.id, ctx.workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);

  const body = reportSchema.parse(await req.json());
  const db = await getDb();

  await db.insert(schema.reports).values({
    workspaceId: ctx.workspace.id,
    reporterId: user.id,
    targetType: body.targetType,
    targetId: body.targetId,
    reason: body.reason,
  });

  return jsonOk({ success: true }, 201);
});
