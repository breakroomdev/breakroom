import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { updateWorkspaceAuthSchema } from "@/lib/validation/workspace";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { slug: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const db = await getDb();
  const settings = await db.query.workspaceSettings.findFirst({ where: eq(schema.workspaceSettings.workspaceId, membership.workspace.id) });

  return jsonOk({
    settings: settings
      ? {
          authPasswordEnabled: settings.authPasswordEnabled,
          authDiscordEnabled: settings.authDiscordEnabled,
          allowSelfRegistration: settings.allowSelfRegistration,
        }
      : null,
  });
});

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "workspace.manage");

  const body = updateWorkspaceAuthSchema.parse(await req.json());
  const db = await getDb();

  await db
    .update(schema.workspaceSettings)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(schema.workspaceSettings.workspaceId, membership.workspace.id));

  return jsonOk({ success: true });
});
