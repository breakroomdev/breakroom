import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { locationSchema } from "@/lib/validation/shifts";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { slug: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  const db = await getDb();
  const locations = await db.query.locations.findMany({ where: eq(schema.locations.workspaceId, membership.workspace.id) });
  return jsonOk({ locations });
});

export const POST = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);
  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "schedule.manage");

  const body = locationSchema.parse(await req.json());
  const db = await getDb();
  const [location] = await db.insert(schema.locations).values({ workspaceId: membership.workspace.id, ...body }).returning();
  return jsonOk({ location }, 201);
});
