import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createWorkspace, generateUniqueSlug } from "@/lib/workspace-service";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(48).optional(),
});

export const POST = withErrorHandling(async (req: Request) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in first.", 401);

  const body = createWorkspaceSchema.parse(await req.json());
  const slug = body.slug ? await generateUniqueSlug(body.slug) : undefined;
  const workspace = await createWorkspace({ name: body.name, ownerId: user.id, slug });

  return jsonOk({ slug: workspace.slug }, 201);
});
