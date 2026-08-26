import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, requirePermission } from "@/lib/auth/authorize";
import { updateShiftSchema } from "@/lib/validation/shifts";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";
import { notify } from "@/lib/notifications";

async function loadShiftContext(shiftId: string) {
  const db = await getDb();
  const shift = await db.query.shifts.findFirst({ where: eq(schema.shifts.id, shiftId) });
  if (!shift) return null;
  const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, shift.workspaceId) });
  if (!workspace) return null;
  return { shift, workspace };
}

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const ctx = await loadShiftContext(params.id);
  if (!ctx) return jsonError("Shift not found", 404);

  const membership = await getMembership(user.id, ctx.workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);
  requirePermission(membership, "schedule.manage");

  const body = updateShiftSchema.parse(await req.json());
  const db = await getDb();

  const previousUserId = ctx.shift.userId;

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
    .where(eq(schema.shifts.id, ctx.shift.id))
    .returning();

  if (updated?.userId && updated.userId !== user.id) {
    await notify({
      workspaceId: ctx.workspace.id,
      userId: updated.userId,
      actorId: user.id,
      type: previousUserId === updated.userId ? "shift_updated" : "shift_assigned",
      title: previousUserId === updated.userId ? "Your shift was updated" : "You've been scheduled for a new shift",
      body: `${updated.date} · ${updated.startTime}–${updated.endTime}${updated.location ? ` · ${updated.location}` : ""}`,
      link: `/${ctx.workspace.slug}/schedule`,
    });
  }

  return jsonOk({ shift: updated });
});

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const ctx = await loadShiftContext(params.id);
  if (!ctx) return jsonError("Shift not found", 404);

  const membership = await getMembership(user.id, ctx.workspace.slug);
  if (!membership) return jsonError("Not a member of this workspace", 403);
  requirePermission(membership, "schedule.manage");

  const db = await getDb();
  await db.delete(schema.shifts).where(eq(schema.shifts.id, ctx.shift.id));

  if (ctx.shift.userId && ctx.shift.userId !== user.id) {
    await notify({
      workspaceId: ctx.workspace.id,
      userId: ctx.shift.userId,
      actorId: user.id,
      type: "shift_removed",
      title: "A shift was removed from your schedule",
      body: `${ctx.shift.date} · ${ctx.shift.startTime}–${ctx.shift.endTime}`,
      link: `/${ctx.workspace.slug}/schedule`,
    });
  }

  return jsonOk({ success: true });
});
