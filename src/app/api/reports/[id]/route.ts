import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

const bodySchema = z.object({ status: z.enum(["resolved", "dismissed"]) });

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const db = await getDb();
  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, params.id) });
  if (!report) return jsonError("Report not found", 404);

  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, report.workspaceId) });
  if (!workspace) return jsonError("Workspace not found", 404);

  const membership = await getMembership(user.id, workspace.slug);
  if (!membership) return jsonError("Not a member", 403);
  requirePermission(membership, "posts.moderate");

  const { status } = bodySchema.parse(await req.json());
  const [updated] = await db
    .update(schema.reports)
    .set({ status, resolvedBy: user.id, resolvedAt: new Date() })
    .where(eq(schema.reports.id, params.id))
    .returning();

  return jsonOk({ report: updated });
});
