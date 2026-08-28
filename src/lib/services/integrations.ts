import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth/tokens";

export type IntegrationStatus = "connected" | "disconnected" | "error";

export function computeIntegrationStatus(integration: {
  enabled: boolean;
  lastActivityAt: Date | null;
  lastErrorAt: Date | null;
}): IntegrationStatus {
  if (!integration.enabled) return "disconnected";
  if (integration.lastErrorAt && (!integration.lastActivityAt || integration.lastErrorAt > integration.lastActivityAt)) {
    return "error";
  }
  return integration.lastActivityAt ? "connected" : "disconnected";
}

export async function listIntegrations(workspaceId: string) {
  const db = await getDb();
  return db.query.integrations.findMany({ where: eq(schema.integrations.workspaceId, workspaceId) });
}

export async function getIntegration(workspaceId: string, id: string) {
  const db = await getDb();
  return db.query.integrations.findFirst({ where: and(eq(schema.integrations.id, id), eq(schema.integrations.workspaceId, workspaceId)) });
}

interface CreateIntegrationInput {
  workspaceId: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  createdBy: string;
}

/** Creates an integration and its secret. The plaintext secret is only ever returned here — store it securely, it can't be retrieved again. */
export async function createIntegration(input: CreateIntegrationInput): Promise<{ integration: typeof schema.integrations.$inferSelect; secret: string }> {
  const db = await getDb();
  const secret = generateToken(32);
  const secretHash = await hashToken(secret);

  const [integration] = await db
    .insert(schema.integrations)
    .values({
      workspaceId: input.workspaceId,
      type: input.type,
      name: input.name,
      config: input.config,
      secretHash,
      secretLastFour: secret.slice(-4),
      createdBy: input.createdBy,
    })
    .returning();

  if (!integration) throw new Error("Failed to create integration");
  return { integration, secret };
}

export async function updateIntegration(
  workspaceId: string,
  id: string,
  patch: { name?: string; enabled?: boolean; config?: Record<string, unknown> }
) {
  const db = await getDb();
  const existing = await getIntegration(workspaceId, id);
  if (!existing) return null;

  const nextConfig = patch.config ? { ...(existing.config as Record<string, unknown>), ...patch.config } : undefined;

  const [updated] = await db
    .update(schema.integrations)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
      ...(nextConfig ? { config: nextConfig } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.integrations.id, id))
    .returning();

  return updated;
}

/** Regenerates an integration's secret. The old secret stops working immediately (the hash is overwritten). */
export async function regenerateIntegrationSecret(workspaceId: string, id: string): Promise<string | null> {
  const db = await getDb();
  const existing = await getIntegration(workspaceId, id);
  if (!existing) return null;

  const secret = generateToken(32);
  const secretHash = await hashToken(secret);
  await db
    .update(schema.integrations)
    .set({ secretHash, secretLastFour: secret.slice(-4), updatedAt: new Date() })
    .where(eq(schema.integrations.id, id));

  return secret;
}

export async function deleteIntegration(workspaceId: string, id: string): Promise<void> {
  const db = await getDb();
  await db.delete(schema.integrations).where(and(eq(schema.integrations.id, id), eq(schema.integrations.workspaceId, workspaceId)));
}

/** Looks up an integration by its plaintext secret (hashes it first) — used by unauthenticated ingest endpoints. */
export async function findIntegrationBySecret(type: string, secret: string) {
  const db = await getDb();
  const secretHash = await hashToken(secret);
  return db.query.integrations.findFirst({ where: and(eq(schema.integrations.secretHash, secretHash), eq(schema.integrations.type, type)) });
}

export async function recordIntegrationSuccess(id: string): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.integrations)
    .set({ lastActivityAt: new Date(), messageCount: sql`${schema.integrations.messageCount} + 1`, lastError: null, lastErrorAt: null })
    .where(eq(schema.integrations.id, id));
}

export async function recordIntegrationError(id: string, error: string): Promise<void> {
  const db = await getDb();
  await db.update(schema.integrations).set({ lastErrorAt: new Date(), lastError: error.slice(0, 500) }).where(eq(schema.integrations.id, id));
}
