import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

const schema_ = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128) });

export const PATCH = withErrorHandling(async (req: Request) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const { currentPassword, newPassword } = schema_.parse(await req.json());
  const db = await getDb();

  if (user.passwordHash) {
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return jsonError("Current password is incorrect.", 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(schema.users).set({ passwordHash, updatedAt: new Date() }).where(eq(schema.users.id, user.id));

  return jsonOk({ success: true });
});
