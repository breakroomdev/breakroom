import "server-only";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface ShiftWithUser {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  role: string | null;
  notes: string | null;
  color: string | null;
  user: { id: string; displayName: string; avatarUrl: string | null } | null;
}

export async function listShifts(workspaceId: string, start: string, end: string): Promise<ShiftWithUser[]> {
  const db = await getDb();
  const rows = await db
    .select({ shift: schema.shifts, user: schema.users })
    .from(schema.shifts)
    .leftJoin(schema.users, eq(schema.users.id, schema.shifts.userId))
    .where(and(eq(schema.shifts.workspaceId, workspaceId), gte(schema.shifts.date, start), lte(schema.shifts.date, end)))
    .orderBy(asc(schema.shifts.date), asc(schema.shifts.startTime));

  return rows.map((r) => ({
    id: r.shift.id,
    date: r.shift.date,
    startTime: r.shift.startTime,
    endTime: r.shift.endTime,
    location: r.shift.location,
    role: r.shift.role,
    notes: r.shift.notes,
    color: r.shift.color,
    user: r.user ? { id: r.user.id, displayName: r.user.displayName, avatarUrl: r.user.avatarUrl } : null,
  }));
}
