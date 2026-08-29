import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { authenticateApiApp } from "@/lib/api/public-auth";
import { recordIntegrationSuccess, recordIntegrationError } from "@/lib/services/integrations";
import { createShiftSchema } from "@/lib/validation/shifts";
import { listShifts } from "@/lib/services/schedule";
import { notify } from "@/lib/notifications";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");
const rangeSchema = z.object({ start: dateSchema, end: dateSchema });

export const GET = withErrorHandling(async (req: Request) => {
  const auth = await authenticateApiApp(req);
  if ("error" in auth) return auth.error;
  const { app } = auth;

  const url = new URL(req.url);
  const parsed = rangeSchema.safeParse({ start: url.searchParams.get("start"), end: url.searchParams.get("end") });
  if (!parsed.success) {
    await recordIntegrationError(app.id, "Rejected shift list request: invalid start/end");
    return jsonError("start and end query params are required, in YYYY-MM-DD format", 422, parsed.error.flatten());
  }

  const shifts = await listShifts(app.workspaceId, parsed.data.start, parsed.data.end);
  await recordIntegrationSuccess(app.id);
  return jsonOk({ shifts });
});

export const POST = withErrorHandling(async (req: Request) => {
  const auth = await authenticateApiApp(req);
  if ("error" in auth) return auth.error;
  const { app } = auth;

  const parsed = createShiftSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    await recordIntegrationError(app.id, `Rejected shift payload: ${parsed.error.issues[0]?.message ?? "invalid body"}`);
    return jsonError("Invalid request body", 422, parsed.error.flatten());
  }
  const body = parsed.data;

  const db = await getDb();
  const [shift] = await db
    .insert(schema.shifts)
    .values({
      workspaceId: app.workspaceId,
      userId: body.userId || null,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location,
      role: body.role,
      notes: body.notes,
      color: body.color,
      createdBy: app.createdBy,
    })
    .returning();

  if (!shift) {
    await recordIntegrationError(app.id, "Failed to create shift");
    return jsonError("Failed to create shift", 500);
  }

  if (shift.userId && shift.userId !== app.createdBy) {
    const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, app.workspaceId) });
    if (workspace) {
      await notify({
        workspaceId: app.workspaceId,
        userId: shift.userId,
        actorId: app.createdBy,
        type: "shift_assigned",
        title: "You've been scheduled for a new shift",
        body: `${shift.date} · ${shift.startTime}–${shift.endTime}${shift.location ? ` · ${shift.location}` : ""}`,
        link: `/${workspace.slug}/schedule`,
      });
    }
  }

  await recordIntegrationSuccess(app.id);
  return jsonOk({ shift }, 201);
});
