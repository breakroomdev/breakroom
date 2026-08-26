import { eq, or } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const POST = withErrorHandling(async (req: Request) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const ip = clientIp(req.headers);
  const limit = rateLimit(`login:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.success) return jsonError("Too many login attempts. Try again in a few minutes.", 429);

  const body = loginSchema.parse(await req.json());
  const db = await getDb();
  const identifier = body.identifier.toLowerCase();

  const user = await db.query.users.findFirst({
    where: or(eq(schema.users.email, identifier), eq(schema.users.username, identifier)),
  });

  if (!user || !user.passwordHash) {
    return jsonError("Invalid username/email or password.", 401);
  }
  if (user.disabledAt) {
    return jsonError("This account has been disabled.", 403);
  }

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    return jsonError("Invalid username/email or password.", 401);
  }

  await createSession(user.id);

  return jsonOk({ user: { id: user.id, username: user.username, displayName: user.displayName } });
});
