import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { authenticateApiApp } from "@/lib/api/public-auth";
import { recordIntegrationSuccess } from "@/lib/services/integrations";
import { jsonOk, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (req: Request) => {
  const auth = await authenticateApiApp(req);
  if ("error" in auth) return auth.error;
  const { app } = auth;

  const db = await getDb();
  const rows = await db.query.roles.findMany({ where: eq(schema.roles.workspaceId, app.workspaceId) });

  await recordIntegrationSuccess(app.id);
  return jsonOk({ roles: rows.map((r) => ({ id: r.id, key: r.key, name: r.name })) });
});
