"use client";

import * as React from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { buildRobloxScript } from "@/lib/integrations/roblox-script";

export function RobloxScriptBlock({ apiUrl, secret, universeId, placeId }: { apiUrl: string; secret: string; universeId: string; placeId: string }) {
  const script = React.useMemo(() => buildRobloxScript({ apiUrl, secret, universeId, placeId }), [apiUrl, secret, universeId, placeId]);
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">ServerScriptService/BreakroomChatLogger.lua</p>
        <CopyButton value={script} label="Copy script" />
      </div>
      <pre className="max-h-56 overflow-auto bg-card p-3 text-[11px] leading-relaxed text-foreground/90">
        <code>{script}</code>
      </pre>
    </div>
  );
}
