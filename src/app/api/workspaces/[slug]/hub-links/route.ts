import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { createHubLinkSchema } from "@/lib/validation/hub";
import { listHubLinks } from "@/lib/services/hub";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";
import { count, eq } from "drizzle-orm";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { slug: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  const links = await listHubLinks(membership.workspace.id);
  return jsonOk({ links });
});

export const POST = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { userId, membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const body = createHubLinkSchema.parse(await req.json());
  const db = await getDb();

  const [{ value: existingCount = 0 } = {}] = await db
    .select({ value: count() })
    .from(schema.hubLinks)
    .where(eq(schema.hubLinks.workspaceId, membership.workspace.id));

  const [link] = await db
    .insert(schema.hubLinks)
    .values({
      workspaceId: membership.workspace.id,
      title: body.title,
      url: body.url,
      description: body.description,
      openMode: body.openMode,
      position: existingCount,
      createdBy: userId,
    })
    .returning();

  return jsonOk({ link }, 201);
});
