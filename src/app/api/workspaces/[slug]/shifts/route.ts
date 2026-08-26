import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { requirePermission } from "@/lib/auth/authorize";
import { createShiftSchema } from "@/lib/validation/shifts";
import { listShifts } from "@/lib/services/schedule";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";
import { notify } from "@/lib/notifications";

const rangeSchema = z.object({ start: z.string(), end: z.string() });

export const GET = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  const url = new URL(req.url);
  const { start, end } = rangeSchema.parse({ start: url.searchParams.get("start"), end: url.searchParams.get("end") });

  const shifts = await listShifts(membership.workspace.id, start, end);
  return jsonOk({ shifts });
});

export const POST = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const { userId, membership } = await requireWorkspaceContext(params.slug);
  requirePermission(membership, "schedule.manage");

  const body = createShiftSchema.parse(await req.json());
  const db = await getDb();

  const [shift] = await db
    .insert(schema.shifts)
    .values({
      workspaceId: membership.workspace.id,
      userId: body.userId || null,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location,
      role: body.role,
      notes: body.notes,
      color: body.color,
      createdBy: userId,
    })
    .returning();

  if (!shift) return jsonError("Failed to create shift", 500);

  if (shift.userId && shift.userId !== userId) {
    await notify({
      workspaceId: membership.workspace.id,
      userId: shift.userId,
      actorId: userId,
      type: "shift_assigned",
      title: "You've been scheduled for a new shift",
      body: `${shift.date} · ${shift.startTime}–${shift.endTime}${shift.location ? ` · ${shift.location}` : ""}`,
      link: `/${membership.workspace.slug}/schedule`,
    });
  }

  return jsonOk({ shift }, 201);
});
