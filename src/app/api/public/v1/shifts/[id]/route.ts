import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { authenticateApiApp } from "@/lib/api/public-auth";
import { recordIntegrationSuccess, recordIntegrationError } from "@/lib/services/integrations";
import { updateShiftSchema } from "@/lib/validation/shifts";
import { notify } from "@/lib/notifications";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const auth = await authenticateApiApp(req);
  if ("error" in auth) return auth.error;
  const { app } = auth;

  const db = await getDb();
  const shift = await db.query.shifts.findFirst({ where: eq(schema.shifts.id, params.id) });
  if (!shift || shift.workspaceId !== app.workspaceId) return jsonError("Shift not found", 404);

  const parsed = updateShiftSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    await recordIntegrationError(app.id, `Rejected shift update: ${parsed.error.issues[0]?.message ?? "invalid body"}`);
    return jsonError("Invalid request body", 422, parsed.error.flatten());
  }
  const body = parsed.data;
  const previousUserId = shift.userId;

  const [updated] = await db
    .update(schema.shifts)
    .set({
      ...(body.userId !== undefined ? { userId: body.userId || null } : {}),
      ...(body.date !== undefined ? { date: body.date } : {}),
      ...(body.startTime !== undefined ? { startTime: body.startTime } : {}),
      ...(body.endTime !== undefined ? { endTime: body.endTime } : {}),
      ...(body.location !== undefined ? { location: body.location } : {}),
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.color !== undefined ? { color: body.color } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.shifts.id, shift.id))
    .returning();

  if (updated?.userId && updated.userId !== app.createdBy) {
    const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, app.workspaceId) });
    if (workspace) {
      await notify({
        workspaceId: app.workspaceId,
        userId: updated.userId,
        actorId: app.createdBy,
        type: previousUserId === updated.userId ? "shift_updated" : "shift_assigned",
        title: previousUserId === updated.userId ? "Your shift was updated" : "You've been scheduled for a new shift",
        body: `${updated.date} · ${updated.startTime}–${updated.endTime}${updated.location ? ` · ${updated.location}` : ""}`,
        link: `/${workspace.slug}/schedule`,
      });
    }
  }

  await recordIntegrationSuccess(app.id);
  return jsonOk({ shift: updated });
});

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const auth = await authenticateApiApp(req);
  if ("error" in auth) return auth.error;
  const { app } = auth;

  const db = await getDb();
  const shift = await db.query.shifts.findFirst({ where: eq(schema.shifts.id, params.id) });
  if (!shift || shift.workspaceId !== app.workspaceId) return jsonError("Shift not found", 404);

  await db.delete(schema.shifts).where(eq(schema.shifts.id, shift.id));

  if (shift.userId && shift.userId !== app.createdBy) {
    const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, app.workspaceId) });
    if (workspace) {
      await notify({
        workspaceId: app.workspaceId,
        userId: shift.userId,
        actorId: app.createdBy,
        type: "shift_removed",
        title: "A shift was removed from your schedule",
        body: `${shift.date} · ${shift.startTime}–${shift.endTime}`,
        link: `/${workspace.slug}/schedule`,
      });
    }
  }

  await recordIntegrationSuccess(app.id);
  return jsonOk({ success: true });
});
