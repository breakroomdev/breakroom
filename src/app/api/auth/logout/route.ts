import { destroySession } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/api/response";

export const POST = withErrorHandling(async () => {
  await destroySession();
  return jsonOk({ success: true });
});
