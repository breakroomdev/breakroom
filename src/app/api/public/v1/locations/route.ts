import { authenticateApiApp } from "@/lib/api/public-auth";
import { recordIntegrationSuccess } from "@/lib/services/integrations";
import { listLocations } from "@/lib/services/schedule";
import { jsonOk, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (req: Request) => {
  const auth = await authenticateApiApp(req);
  if ("error" in auth) return auth.error;
  const { app } = auth;

  const locations = await listLocations(app.workspaceId);
  await recordIntegrationSuccess(app.id);
  return jsonOk({ locations });
});
