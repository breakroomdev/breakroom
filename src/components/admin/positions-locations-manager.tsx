"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/workspace-context";

interface Position {
  id: string;
  name: string;
  color: string;
}
interface Location {
  id: string;
  name: string;
  address: string | null;
}

export function PositionsLocationsManager({ initialPositions, initialLocations }: { initialPositions: Position[]; initialLocations: Location[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PositionsCard initial={initialPositions} />
      <LocationsCard initial={initialLocations} />
    </div>
  );
}

function PositionsCard({ initial }: { initial: Position[] }) {
  const { workspace } = useWorkspace();
  const [items, setItems] = React.useState(initial);
  const [name, setName] = React.useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch(`/api/workspaces/${workspace.slug}/positions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error("Couldn't add position.");
    setItems((p) => [...p, data.position]);
    setName("");
  }

  async function remove(id: string) {
    setItems((p) => p.filter((i) => i.id !== id));
    const res = await fetch(`/api/positions/${id}`, { method: "DELETE" });
    if (!res.ok) toast.error("Couldn't remove position.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Positions</CardTitle>
        <CardDescription>Roles you can assign to a shift, like "Barista" or "Cashier".</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={add} className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a position…" />
          <Button type="submit" size="icon" aria-label="Add position">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              {item.name}
              <button onClick={() => remove(item.id)} aria-label="Remove">
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LocationsCard({ initial }: { initial: Location[] }) {
  const { workspace } = useWorkspace();
  const [items, setItems] = React.useState(initial);
  const [name, setName] = React.useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch(`/api/workspaces/${workspace.slug}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error("Couldn't add location.");
    setItems((p) => [...p, data.location]);
    setName("");
  }

  async function remove(id: string) {
    setItems((p) => p.filter((i) => i.id !== id));
    const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    if (!res.ok) toast.error("Couldn't remove location.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Locations</CardTitle>
        <CardDescription>Places shifts can happen, like "Downtown" or "Warehouse".</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={add} className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a location…" />
          <Button type="submit" size="icon" aria-label="Add location">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              {item.name}
              <button onClick={() => remove(item.id)} aria-label="Remove">
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
