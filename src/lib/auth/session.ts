import "server-only";
import { cookies, headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { generateToken, hashToken } from "./tokens";

export const SESSION_COOKIE = "breakroom_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SessionUser = typeof schema.users.$inferSelect;

export async function createSession(userId: string): Promise<string> {
  const db = await getDb();
  const token = generateToken();
  const tokenHash = await hashToken(token);
  const hdrs = headers();

  await db.insert(schema.sessions).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    userAgent: hdrs.get("user-agent") ?? undefined,
    ipAddress: hdrs.get("x-forwarded-for") ?? undefined,
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  cookies().delete(SESSION_COOKIE);
  if (!token) return;

  const db = await getDb();
  const tokenHash = await hashToken(token);
  await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, tokenHash));
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const tokenHash = await hashToken(token);

  const rows = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.tokenHash, tokenHash), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);

  const user = rows[0]?.user;
  if (!user || user.disabledAt) return null;
  return user;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not authenticated");
  return user;
}

export class AuthError extends Error {
  status = 401;
}
