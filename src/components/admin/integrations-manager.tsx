"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Circle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INTEGRATION_TYPES, getIntegrationType } from "@/lib/integrations/registry";
import { RobloxConnectWizard } from "@/components/admin/integrations/roblox-connect-wizard";
import { RobloxManagePanel } from "@/components/admin/integrations/roblox-manage-panel";

export interface IntegrationRow {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  config: Record<string, string>;
  status: "connected" | "disconnected" | "error";
  secretLastFour: string | null;
  lastActivityAt: number | null;
  lastErrorAt: number | null;
  lastError: string | null;
  messageCount: number;
  createdAt: number;
}

const STATUS_META = {
  connected: { label: "Connected", icon: CheckCircle2, className: "text-success" },
  disconnected: { label: "Disconnected", icon: Circle, className: "text-muted-foreground" },
  error: { label: "Error", icon: AlertCircle, className: "text-destructive" },
} as const;

function StatusBadge({ status }: { status: IntegrationRow["status"] }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={status === "connected" ? "success" : status === "error" ? "destructive" : "secondary"} className="gap-1">
      <meta.icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

export function IntegrationsManager({ initialIntegrations, basePath }: { initialIntegrations: IntegrationRow[]; basePath: string }) {
  const [integrations, setIntegrations] = React.useState(initialIntegrations);
  const [connecting, setConnecting] = React.useState(false);
  const [managing, setManaging] = React.useState<IntegrationRow | null>(null);

  const roblox = integrations.find((i) => i.type === "roblox_chat");

  function upsert(row: IntegrationRow) {
    setIntegrations((prev) => (prev.some((i) => i.id === row.id) ? prev.map((i) => (i.id === row.id ? row : i)) : [...prev, row]));
  }

  function remove(id: string) {
    setIntegrations((prev) => prev.filter((i) => i.id !== id));
    setManaging(null);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {INTEGRATION_TYPES.map((def) => {
        if (def.type === "roblox_chat") {
          return (
            <Card key={def.type} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary">
                    <def.icon className="h-5 w-5" />
                  </div>
                  {roblox ? <StatusBadge status={roblox.status} /> : null}
                </div>
                <div>
                  <p className="font-display text-base font-semibold">{def.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{def.description}</p>
                </div>
                {roblox ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {roblox.messageCount} message{roblox.messageCount === 1 ? "" : "s"} logged
                    </p>
                    <div className="mt-auto flex gap-2 pt-2">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => setManaging(roblox)}>
                        Manage
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`${basePath}/integrations/roblox/${roblox.id}`}>View chat</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button size="sm" className="mt-auto" onClick={() => setConnecting(true)}>
                    <Plus className="h-3.5 w-3.5" /> Connect
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={def.type} className="flex flex-col opacity-60">
            <CardContent className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <def.icon className="h-5 w-5" />
                </div>
                <Badge variant="secondary">Coming soon</Badge>
              </div>
              <div>
                <p className="font-display text-base font-semibold">{def.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{def.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <RobloxConnectWizard
        open={connecting}
        onOpenChange={setConnecting}
        onConnected={(row) => {
          upsert(row);
          setManaging(row);
        }}
      />

      <RobloxManagePanel
        integration={managing}
        typeDef={getIntegrationType("roblox_chat")!}
        basePath={basePath}
        onOpenChange={(open) => !open && setManaging(null)}
        onChanged={upsert}
        onDisconnected={remove}
      />
    </div>
  );
}
