import { getCurrentUser } from "@/lib/auth/session";
import { requireSiteAdmin } from "@/lib/auth/authorize";
import { listWorkspacesForStaff } from "@/lib/services/staff";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  requireSiteAdmin(user);

  const workspaces = await listWorkspacesForStaff();
  return jsonOk({ workspaces });
});
