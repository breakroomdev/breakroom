import { authenticateApiApp } from "@/lib/api/public-auth";
import { recordIntegrationSuccess } from "@/lib/services/integrations";
import { listTeamMembers } from "@/lib/services/team";
import { jsonOk, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (req: Request) => {
  const auth = await authenticateApiApp(req);
  if ("error" in auth) return auth.error;
  const { app } = auth;

  const members = await listTeamMembers(app.workspaceId);
  await recordIntegrationSuccess(app.id);
  return jsonOk({ members });
});
