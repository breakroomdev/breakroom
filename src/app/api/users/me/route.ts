import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/validation/workspace";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";
import { COLOR_MODE_COOKIE } from "@/lib/theme";
import { cookies } from "next/headers";

export const PATCH = withErrorHandling(async (req: Request) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const body = updateProfileSchema.parse(await req.json());
  const db = await getDb();

  const [updated] = await db
    .update(schema.users)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id))
    .returning();

  if (body.colorMode) {
    cookies().set(COLOR_MODE_COOKIE, body.colorMode, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  }

  return jsonOk({ user: updated });
});
