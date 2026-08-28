import { getCurrentUser } from "@/lib/auth/session";
import { getRobloxProfile } from "@/lib/services/roblox";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (req: Request, { params }: { params: { userId: string } }) => {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const userId = Number(params.userId);
  if (!Number.isInteger(userId) || userId <= 0) return jsonError("Invalid Roblox user ID", 422);

  const url = new URL(req.url);
  const fallbackUsername = url.searchParams.get("username") ?? `user-${userId}`;
  const fallbackDisplayName = url.searchParams.get("displayName") ?? fallbackUsername;

  const profile = await getRobloxProfile(userId, { username: fallbackUsername, displayName: fallbackDisplayName });
  return jsonOk({ profile });
});
