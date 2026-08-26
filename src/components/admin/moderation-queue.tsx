"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, X, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/utils";

interface Report {
  id: string;
  targetType: "post" | "comment" | "poll";
  targetId: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: number;
  reporter: { displayName: string; avatarUrl: string | null };
  targetPreview: string | null;
  targetExists: boolean;
}

export function ModerationQueue({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = React.useState(initialReports);
  const open = reports.filter((r) => r.status === "open");
  const resolved = reports.filter((r) => r.status !== "open");

  async function updateStatus(id: string, status: "resolved" | "dismissed") {
    setReports((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    const res = await fetch(`/api/reports/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!res.ok) toast.error("Couldn't update report.");
  }

  async function deleteContent(report: Report) {
    if (report.targetType !== "post") return;
    const res = await fetch(`/api/posts/${report.targetId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't delete post.");
      return;
    }
    toast.success("Post deleted");
    updateStatus(report.id, "resolved");
  }

  if (reports.length === 0) {
    return <EmptyState icon="🛡️" title="Nothing to review" description="Reported posts, comments and polls will show up here." />;
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">Open reports ({open.length})</h2>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open reports. Nice and quiet.</p>
        ) : (
          <div className="space-y-3">
            {open.map((report) => (
              <Card key={report.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={report.reporter.displayName} src={report.reporter.avatarUrl} size="sm" />
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{report.reporter.displayName}</span> reported a {report.targetType}
                        </p>
                        <p className="text-xs text-muted-foreground">{relativeTime(new Date(report.createdAt))}</p>
                      </div>
                    </div>
                    <Badge variant="warning">Open</Badge>
                  </div>
                  <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm italic">"{report.reason}"</p>
                  {report.targetPreview ? <p className="line-clamp-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">{report.targetPreview}</p> : null}
                  {!report.targetExists ? <p className="text-xs text-muted-foreground">This content has already been removed.</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => updateStatus(report.id, "dismissed")}>
                      <X className="h-3.5 w-3.5" /> Dismiss
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => updateStatus(report.id, "resolved")}>
                      <Check className="h-3.5 w-3.5" /> Mark resolved
                    </Button>
                    {report.targetType === "post" && report.targetExists ? (
                      <Button size="sm" variant="destructive" onClick={() => deleteContent(report)}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete post
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {resolved.length > 0 ? (
        <section>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">History</h2>
          <div className="space-y-2">
            {resolved.map((report) => (
              <div key={report.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  {report.reporter.displayName} reported a {report.targetType}
                </span>
                <Badge variant={report.status === "resolved" ? "success" : "secondary"} className="capitalize">
                  {report.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
