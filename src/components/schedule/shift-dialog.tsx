"use client";

import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useWorkspace } from "@/components/workspace-context";
import type { ShiftWithUser } from "@/lib/services/schedule";

const SHIFT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

interface TeamOption {
  id: string;
  displayName: string;
}

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  shift?: ShiftWithUser | null;
  team: TeamOption[];
  onSaved: (shift: ShiftWithUser) => void;
  onDeleted?: (id: string) => void;
}

export function ShiftDialog({ open, onOpenChange, date, shift, team, onSaved, onDeleted }: ShiftDialogProps) {
  const { workspace } = useWorkspace();
  const [userId, setUserId] = React.useState<string>(shift?.user?.id ?? "unassigned");
  const [startTime, setStartTime] = React.useState(shift?.startTime ?? "09:00");
  const [endTime, setEndTime] = React.useState(shift?.endTime ?? "17:00");
  const [location, setLocation] = React.useState(shift?.location ?? "");
  const [role, setRole] = React.useState(shift?.role ?? "");
  const [notes, setNotes] = React.useState(shift?.notes ?? "");
  const [color, setColor] = React.useState(shift?.color ?? SHIFT_COLORS[0]!);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setUserId(shift?.user?.id ?? "unassigned");
      setStartTime(shift?.startTime ?? "09:00");
      setEndTime(shift?.endTime ?? "17:00");
      setLocation(shift?.location ?? "");
      setRole(shift?.role ?? "");
      setNotes(shift?.notes ?? "");
      setColor(shift?.color ?? SHIFT_COLORS[0]!);
    }
  }, [open, shift]);

  async function save() {
    if (startTime >= endTime) return toast.error("End time must be after start time.");
    setSaving(true);
    try {
      const payload = {
        userId: userId === "unassigned" ? null : userId,
        date,
        startTime,
        endTime,
        location: location || null,
        role: role || null,
        notes: notes || null,
        color,
      };
      const res = shift
        ? await fetch(`/api/shifts/${shift.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch(`/api/workspaces/${workspace.slug}/shifts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't save shift.");
        return;
      }
      const saved = data.shift;
      const teamMember = team.find((t) => t.id === saved.userId);
      onSaved({ ...saved, user: teamMember ? { id: teamMember.id, displayName: teamMember.displayName, avatarUrl: null } : null });
      toast.success(shift ? "Shift updated" : "Shift created");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!shift) return;
    const res = await fetch(`/api/shifts/${shift.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't delete shift.");
      return;
    }
    onDeleted?.(shift.id);
    toast.success("Shift deleted");
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{shift ? "Edit shift" : "New shift"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Employee" htmlFor="employee">
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned (open shift)</SelectItem>
                  {team.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start time" htmlFor="start">
                <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </Field>
              <Field label="End time" htmlFor="end">
                <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Location" htmlFor="location">
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Front desk" />
              </Field>
              <Field label="Role / position" htmlFor="role">
                <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Barista" />
              </Field>
            </div>

            <Field label="Notes" htmlFor="notes">
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} className="min-h-[70px]" />
            </Field>

            <Field label="Color">
              <div className="flex gap-2">
                {SHIFT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition-all"
                    style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
                    aria-label={`Choose color ${c}`}
                  />
                ))}
              </div>
            </Field>
          </div>

          <DialogFooter className="sm:justify-between">
            {shift ? (
              <Button variant="destructive" onClick={() => setConfirmDelete(true)} className="sm:mr-auto">
                Delete shift
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={save} loading={saving}>
                Save shift
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this shift?"
        description="This will remove the shift from the schedule."
        confirmLabel="Delete shift"
        onConfirm={remove}
      />
    </>
  );
}
