import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { ModerationQueue } from "@/components/admin/moderation-queue";

export const metadata = { title: "Moderation" };

export default async function AdminModerationPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");
  requirePermission(membership, "posts.moderate");

  const db = await getDb();
  const rows = await db
    .select({ report: schema.reports, reporter: schema.users })
    .from(schema.reports)
    .innerJoin(schema.users, eq(schema.users.id, schema.reports.reporterId))
    .where(eq(schema.reports.workspaceId, membership.workspace.id))
    .orderBy(desc(schema.reports.createdAt));

  const postIds = rows.filter((r) => r.report.targetType === "post").map((r) => r.report.targetId);
  const posts = postIds.length ? await db.query.posts.findMany({ where: (p, { inArray }) => inArray(p.id, postIds) }) : [];

  const reports = rows.map((r) => ({
    id: r.report.id,
    targetType: r.report.targetType,
    targetId: r.report.targetId,
    reason: r.report.reason,
    status: r.report.status,
    createdAt: r.report.createdAt.getTime(),
    reporter: { displayName: r.reporter.displayName, avatarUrl: r.reporter.avatarUrl },
    targetPreview: posts.find((p) => p.id === r.report.targetId)?.content ?? null,
    targetExists: r.report.targetType === "post" ? posts.some((p) => p.id === r.report.targetId) : true,
  }));

  return <ModerationQueue initialReports={reports} />;
}
