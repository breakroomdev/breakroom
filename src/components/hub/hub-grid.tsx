"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Maximize2, Settings, LayoutGrid } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface HubLinkItem {
  id: string;
  title: string;
  url: string;
  description: string | null;
  openMode: "embed" | "new_tab";
}

export function HubGrid({ links, canManage, basePath }: { links: HubLinkItem[]; canManage: boolean; basePath: string }) {
  const [embedded, setEmbedded] = React.useState<HubLinkItem | null>(null);

  if (links.length === 0) {
    return (
      <EmptyState
        icon={<LayoutGrid className="h-6 w-6" />}
        title="Nothing in the Hub yet"
        description={canManage ? "Add links to tools, docs, or dashboards your team uses often." : "Ask a workspace admin to add some links here."}
        action={
          canManage ? (
            <Button asChild>
              <Link href={`${basePath}/admin/hub`}>
                <Settings className="h-4 w-4" /> Manage Hub
              </Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div>
      {canManage ? (
        <div className="mb-4 flex justify-end">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`${basePath}/admin/hub`}>
              <Settings className="h-4 w-4" /> Manage Hub
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => {
          const isEmbed = link.openMode === "embed";
          const cardBody = (
            <CardContent className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary">
                {isEmbed ? <Maximize2 className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{link.title}</p>
                {link.description ? <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{link.description}</p> : null}
                <p className="mt-1 truncate text-xs text-muted-foreground">{isEmbed ? "Opens inline" : "Opens in a new tab"}</p>
              </div>
            </CardContent>
          );

          return isEmbed ? (
            <button key={link.id} type="button" onClick={() => setEmbedded(link)} className="text-left">
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-card-hover">{cardBody}</Card>
            </button>
          ) : (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-card-hover">{cardBody}</Card>
            </a>
          );
        })}
      </div>

      <Dialog open={!!embedded} onOpenChange={(open) => !open && setEmbedded(null)}>
        <DialogContent className="flex h-[85vh] w-[95vw] max-w-5xl flex-col p-0" showClose={false}>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <DialogTitle className="truncate text-base">{embedded?.title}</DialogTitle>
            <div className="flex shrink-0 items-center gap-1.5">
              {embedded ? (
                <Button variant="ghost" size="sm" asChild>
                  <a href={embedded.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
                  </a>
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onClick={() => setEmbedded(null)}>
                Close
              </Button>
            </div>
          </div>
          {embedded ? (
            <iframe
              src={embedded.url}
              title={embedded.title}
              className="flex-1 border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <p className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
            If this looks blank, the site may not allow embedding — try "Open in new tab" instead.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
