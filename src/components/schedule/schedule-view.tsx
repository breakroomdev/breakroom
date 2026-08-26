"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ShiftDialog } from "@/components/schedule/shift-dialog";
import { useWorkspace, useHasPermission } from "@/components/workspace-context";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { monthGrid, weekDays, addDays, addMonths, startOfMonth, startOfWeek, isSameMonth, isToday, WEEKDAY_LABELS } from "@/lib/calendar";
import type { ShiftWithUser } from "@/lib/services/schedule";

type ViewMode = "month" | "week" | "day";
interface TeamOption {
  id: string;
  displayName: string;
}

export function ScheduleView({ initialShifts, team, today }: { initialShifts: ShiftWithUser[]; team: TeamOption[]; today: string }) {
  const { workspace, user } = useWorkspace();
  const canManage = useHasPermission("schedule.manage");

  const [view, setView] = React.useState<ViewMode>("month");
  const [anchor, setAnchor] = React.useState(today);
  const [shifts, setShifts] = React.useState(initialShifts);
  const [mineOnly, setMineOnly] = React.useState(false);
  const [dialogState, setDialogState] = React.useState<{ open: boolean; date: string; shift: ShiftWithUser | null }>({ open: false, date: anchor, shift: null });

  const range = React.useMemo(() => {
    if (view === "month") return { start: startOfWeek(startOfMonth(anchor)), end: addDays(startOfWeek(startOfMonth(anchor)), 41) };
    if (view === "week") return { start: startOfWeek(anchor), end: addDays(startOfWeek(anchor), 6) };
    return { start: anchor, end: anchor };
  }, [view, anchor]);

  React.useEffect(() => {
    fetch(`/api/workspaces/${workspace.slug}/shifts?start=${range.start}&end=${range.end}`)
      .then((r) => r.json())
      .then((data) => setShifts(data.shifts));
  }, [workspace.slug, range.start, range.end]);

  const visibleShifts = mineOnly ? shifts.filter((s) => s.user?.id === user.id) : shifts;

  function shiftsFor(date: string) {
    return visibleShifts.filter((s) => s.date === date);
  }

  function openCreate(date: string) {
    if (!canManage) return;
    setDialogState({ open: true, date, shift: null });
  }

  function openEdit(shift: ShiftWithUser) {
    if (!canManage) return;
    setDialogState({ open: true, date: shift.date, shift });
  }

  function navigate(dir: -1 | 1) {
    if (view === "month") setAnchor(addMonths(anchor, dir));
    else setAnchor(addDays(anchor, dir * (view === "week" ? 7 : 1)));
  }

  const title =
    view === "month"
      ? formatDate(anchor, { month: "long", year: "numeric" })
      : view === "week"
        ? `${formatDate(range.start, { month: "short", day: "numeric" })} – ${formatDate(range.end, { month: "short", day: "numeric" })}`
        : formatDate(anchor, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => navigate(-1)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(today)}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => navigate(1)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 font-display text-lg font-semibold">{title}</h2>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            My shifts only
            <Switch checked={mineOnly} onCheckedChange={setMineOnly} />
          </label>
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
            </TabsList>
          </Tabs>
          {canManage ? (
            <Button size="sm" onClick={() => openCreate(anchor)}>
              <Plus className="h-4 w-4" /> Add shift
            </Button>
          ) : null}
        </div>
      </div>

      {view === "month" ? (
        <MonthGrid anchor={anchor} today={today} shiftsFor={shiftsFor} onDayClick={openCreate} onShiftClick={openEdit} canManage={canManage} />
      ) : view === "week" ? (
        <WeekGrid anchor={anchor} today={today} shiftsFor={shiftsFor} onDayClick={openCreate} onShiftClick={openEdit} canManage={canManage} />
      ) : (
        <DayList date={anchor} shifts={shiftsFor(anchor)} onShiftClick={openEdit} onAdd={() => openCreate(anchor)} canManage={canManage} />
      )}

      {canManage ? (
        <ShiftDialog
          open={dialogState.open}
          onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
          date={dialogState.date}
          shift={dialogState.shift}
          team={team}
          onSaved={(shift) => {
            setShifts((prev) => {
              const exists = prev.some((s) => s.id === shift.id);
              return exists ? prev.map((s) => (s.id === shift.id ? shift : s)) : [...prev, shift];
            });
          }}
          onDeleted={(id) => setShifts((prev) => prev.filter((s) => s.id !== id))}
        />
      ) : null}
    </div>
  );
}

function MonthGrid({
  anchor,
  today,
  shiftsFor,
  onDayClick,
  onShiftClick,
  canManage,
}: {
  anchor: string;
  today: string;
  shiftsFor: (date: string) => ShiftWithUser[];
  onDayClick: (date: string) => void;
  onShiftClick: (shift: ShiftWithUser) => void;
  canManage: boolean;
}) {
  const days = monthGrid(anchor);
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold uppercase text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date) => {
          const dayShifts = shiftsFor(date);
          const inMonth = isSameMonth(date, anchor);
          return (
            <div
              key={date}
              onClick={() => onDayClick(date)}
              className={cn(
                "min-h-[96px] border-b border-r border-border p-1.5 last:border-r-0",
                !inMonth && "bg-muted/20 text-muted-foreground/60",
                canManage && "cursor-pointer hover:bg-muted/40"
              )}
            >
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium", isToday(date, today) && "bg-primary text-primary-foreground")}>
                {Number(date.slice(-2))}
              </span>
              <div className="mt-1 space-y-1">
                {dayShifts.slice(0, 3).map((shift) => (
                  <button
                    key={shift.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShiftClick(shift);
                    }}
                    className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white"
                    style={{ backgroundColor: shift.color ?? "#3b82f6" }}
                  >
                    {formatTime(shift.startTime)} {shift.user?.displayName ?? "Open"}
                  </button>
                ))}
                {dayShifts.length > 3 ? <p className="px-1 text-[11px] text-muted-foreground">+{dayShifts.length - 3} more</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  anchor,
  today,
  shiftsFor,
  onDayClick,
  onShiftClick,
  canManage,
}: {
  anchor: string;
  today: string;
  shiftsFor: (date: string) => ShiftWithUser[];
  onDayClick: (date: string) => void;
  onShiftClick: (shift: ShiftWithUser) => void;
  canManage: boolean;
}) {
  const days = weekDays(anchor);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((date) => {
        const dayShifts = shiftsFor(date);
        return (
          <div key={date} className="rounded-xl border border-border">
            <div className={cn("flex items-center justify-between border-b border-border px-3 py-2", isToday(date, today) && "bg-primary-50 dark:bg-primary-500/10")}>
              <p className="text-sm font-semibold">{formatDate(date, { weekday: "short", day: "numeric" })}</p>
              {canManage ? (
                <button onClick={() => onDayClick(date)} className="text-muted-foreground hover:text-primary">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <div className="space-y-1.5 p-2">
              {dayShifts.length === 0 ? (
                <p className="px-1 py-2 text-center text-xs text-muted-foreground">No shifts</p>
              ) : (
                dayShifts.map((shift) => <ShiftPill key={shift.id} shift={shift} onClick={() => onShiftClick(shift)} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayList({
  date,
  shifts,
  onShiftClick,
  onAdd,
  canManage,
}: {
  date: string;
  shifts: ShiftWithUser[];
  onShiftClick: (shift: ShiftWithUser) => void;
  onAdd: () => void;
  canManage: boolean;
}) {
  if (shifts.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="No shifts scheduled"
        description="Nothing on the books for this day yet."
        action={canManage ? <Button onClick={onAdd}>Add a shift</Button> : undefined}
      />
    );
  }

  return (
    <div className="space-y-2">
      {shifts.map((shift) => (
        <button
          key={shift.id}
          onClick={() => onShiftClick(shift)}
          className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/50"
        >
          <div className="h-full w-1.5 self-stretch rounded-full" style={{ backgroundColor: shift.color ?? "#3b82f6" }} />
          {shift.user ? <Avatar name={shift.user.displayName} src={shift.user.avatarUrl} /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs">Open</div>}
          <div className="min-w-0 flex-1">
            <p className="font-medium">{shift.user?.displayName ?? "Unassigned shift"}</p>
            <p className="text-sm text-muted-foreground">
              {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
              {shift.role ? ` · ${shift.role}` : ""}
              {shift.location ? ` · ${shift.location}` : ""}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function ShiftPill({ shift, onClick }: { shift: ShiftWithUser; onClick: () => void }) {
  return (
    <button onClick={onClick} className="block w-full rounded-lg px-2 py-1.5 text-left text-white" style={{ backgroundColor: shift.color ?? "#3b82f6" }}>
      <p className="truncate text-xs font-semibold">{shift.user?.displayName ?? "Open shift"}</p>
      <p className="truncate text-[11px] opacity-90">
        {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
      </p>
    </button>
  );
}
