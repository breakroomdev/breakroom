import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/tokens";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";

export const POST = withErrorHandling(async (req: Request) => {
  const { token, password } = resetPasswordSchema.parse(await req.json());
  const db = await getDb();
  const tokenHash = await hashToken(token);

  const record = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(schema.passwordResetTokens.tokenHash, tokenHash),
      isNull(schema.passwordResetTokens.usedAt),
      gt(schema.passwordResetTokens.expiresAt, new Date())
    ),
  });

  if (!record) return jsonError("This reset link is invalid or has expired.", 400);

  const passwordHash = await hashPassword(password);
  await db.update(schema.users).set({ passwordHash, updatedAt: new Date() }).where(eq(schema.users.id, record.userId));
  await db.update(schema.passwordResetTokens).set({ usedAt: new Date() }).where(eq(schema.passwordResetTokens.id, record.id));

  // Invalidate all existing sessions for this user for safety.
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, record.userId));

  return jsonOk({ success: true });
});
