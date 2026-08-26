import { getCurrentUser } from "@/lib/auth/session";
import { cloudinaryProvider, isCloudinaryConfigured } from "@/lib/uploads/cloudinary";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const POST = withErrorHandling(async (req: Request) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  if (!isCloudinaryConfigured()) {
    return jsonError("Image uploads aren't configured on this Breakroom instance yet.", 503);
  }

  const signature = cloudinaryProvider.createUploadSignature("breakroom/posts");
  return jsonOk(signature);
});
