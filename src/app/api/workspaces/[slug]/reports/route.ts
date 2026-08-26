import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { jsonOk, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { slug: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "posts.moderate");

  const db = await getDb();
  const rows = await db
    .select({ report: schema.reports, reporter: schema.users })
    .from(schema.reports)
    .innerJoin(schema.users, eq(schema.users.id, schema.reports.reporterId))
    .where(eq(schema.reports.workspaceId, membership.workspace.id))
    .orderBy(desc(schema.reports.createdAt));

  const postIds = rows.filter((r) => r.report.targetType === "post").map((r) => r.report.targetId);
  const posts = postIds.length
    ? await db.query.posts.findMany({ where: (p, { inArray }) => inArray(p.id, postIds) })
    : [];

  return jsonOk({
    reports: rows.map((r) => ({
      id: r.report.id,
      targetType: r.report.targetType,
      targetId: r.report.targetId,
      reason: r.report.reason,
      status: r.report.status,
      createdAt: r.report.createdAt.getTime(),
      reporter: { displayName: r.reporter.displayName, avatarUrl: r.reporter.avatarUrl },
      targetPreview: posts.find((p) => p.id === r.report.targetId)?.content ?? null,
      targetExists: r.report.targetType === "post" ? posts.some((p) => p.id === r.report.targetId) : true,
    })),
  });
});
