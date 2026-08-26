import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requestPasswordResetSchema } from "@/lib/validation/auth";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { jsonOk, withErrorHandling } from "@/lib/api/response";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export const POST = withErrorHandling(async (req: Request) => {
  const limit = rateLimit(`pwreset:${clientIp(req.headers)}`, 5, 15 * 60 * 1000);
  if (!limit.success) {
    // Still return 200 below to avoid leaking rate-limit state to attackers probing emails.
  }

  const { email } = requestPasswordResetSchema.parse(await req.json());
  const db = await getDb();
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email.toLowerCase()) });

  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  if (user && limit.success) {
    const token = generateToken();
    const tokenHash = await hashToken(token);
    await db.insert(schema.passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    });

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
    await sendEmail(
      user.email,
      "Reset your Breakroom password",
      `Someone requested a password reset for your Breakroom account.\n\nReset it here (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`
    );
  }

  return jsonOk({ success: true });
});
