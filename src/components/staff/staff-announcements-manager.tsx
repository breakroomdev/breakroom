"use client";

import * as React from "react";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { relativeTime } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  recipientCount: number;
  createdAt: string;
  sentByName: string;
}

export function StaffAnnouncementsManager({ initialAnnouncements }: { initialAnnouncements: Announcement[] }) {
  const [announcements, setAnnouncements] = React.useState(initialAnnouncements);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [link, setLink] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  async function send() {
    setSending(true);
    try {
      const res = await fetch("/api/staff/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body: body || undefined, link: link || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't send this announcement.");
        return;
      }
      setAnnouncements((prev) => [
        { ...data.announcement, createdAt: new Date(data.announcement.createdAt).toISOString(), sentByName: "You" },
        ...prev,
      ]);
      toast.success(`Sent to ${data.announcement.recipientCount} member${data.announcement.recipientCount === 1 ? "" : "s"}`);
      setTitle("");
      setBody("");
      setLink("");
      setConfirming(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New announcement</CardTitle>
          <CardDescription>Delivered as a notification to every member of every workspace, right away.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title" htmlFor="ann-title">
            <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scheduled maintenance tonight" maxLength={120} />
          </Field>
          <Field label="Body" htmlFor="ann-body" hint="Optional">
            <Textarea id="ann-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} className="min-h-[90px]" />
          </Field>
          <Field label="Link" htmlFor="ann-link" hint="Optional — where the notification takes people">
            <Input id="ann-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
          </Field>
          <Button onClick={() => setConfirming(true)} disabled={!title.trim()}>
            <Megaphone className="h-4 w-4" /> Send to everyone
          </Button>
        </CardContent>
      </Card>

      {announcements.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-6 w-6" />} title="No announcements sent yet" />
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{a.title}</p>
                    {a.body ? <p className="mt-0.5 text-sm text-muted-foreground">{a.body}</p> : null}
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">{relativeTime(new Date(a.createdAt))}</p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Sent by {a.sentByName} to {a.recipientCount} member{a.recipientCount === 1 ? "" : "s"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Send this to everyone?"
        description={`This notifies every member of every workspace on this instance. It can't be recalled once sent.`}
        confirmLabel="Send"
        destructive={false}
        loading={sending}
        onConfirm={send}
      />
    </div>
  );
}
