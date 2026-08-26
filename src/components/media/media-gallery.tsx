"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/workspace-context";
import type { MediaItem } from "@/lib/services/media";

export function MediaGallery({ initialItems, initialCursor }: { initialItems: MediaItem[]; initialCursor: number | null }) {
  const { workspace } = useWorkspace();
  const [items, setItems] = React.useState(initialItems);
  const [cursor, setCursor] = React.useState(initialCursor);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState<MediaItem | null>(null);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}/media?cursor=${cursor}`);
      const data = await res.json();
      setItems((i) => [...i, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <EmptyState icon="🖼️" title="No photos yet" description="Images shared in the feed will show up here." />;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item)}
            className="group relative aspect-square overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image src={item.url} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
          </button>
        ))}
      </div>

      {cursor ? (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={loadMore} loading={loading}>
            Load more
          </Button>
        </div>
      ) : null}

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-3xl p-2">
          {active ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <Image src={active.url} alt="" fill sizes="100vw" className="object-contain" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
