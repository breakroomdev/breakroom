"use client";

import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "post" | "comment" | "poll";
  targetId: string;
}) {
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!reason.trim()) return toast.error("Tell us what's wrong.");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${targetId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason: reason.trim() }),
      });
      if (!res.ok) {
        toast.error("Couldn't submit your report.");
        return;
      }
      toast.success("Thanks — a moderator will take a look.");
      setReason("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this {targetType}</DialogTitle>
          <DialogDescription>Let your workspace admins know what's wrong. They'll review it in Admin → Moderation.</DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What's the issue?" maxLength={500} className="min-h-[100px]" />
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} loading={submitting}>
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
