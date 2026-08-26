import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { positionSchema } from "@/lib/validation/shifts";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { slug: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  const db = await getDb();
  const positions = await db.query.positions.findMany({ where: eq(schema.positions.workspaceId, membership.workspace.id) });
  return jsonOk({ positions });
});

export const POST = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);
  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "schedule.manage");

  const body = positionSchema.parse(await req.json());
  const db = await getDb();
  const [position] = await db.insert(schema.positions).values({ workspaceId: membership.workspace.id, ...body }).returning();
  return jsonOk({ position }, 201);
});
