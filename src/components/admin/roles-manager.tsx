"use client";

import * as React from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS, type Permission } from "@/lib/permissions";

interface Role {
  id: string;
  key: string;
  name: string;
  permissions: string[];
  isSystem: boolean;
}

const PERMISSION_LABELS: Record<Permission, string> = {
  "workspace.manage": "Manage workspace settings",
  "members.manage": "Invite, remove and manage members",
  "roles.manage": "Manage roles and permissions",
  "posts.create": "Create posts",
  "posts.moderate": "Pin, delete and moderate any post",
  "comments.moderate": "Delete any comment",
  "polls.create": "Create polls",
  "polls.moderate": "Delete any poll",
  "schedule.view": "View the schedule",
  "schedule.manage": "Create, edit and delete shifts",
};

export function RolesManager({ roles }: { roles: Role[] }) {
  const [state, setState] = React.useState(roles);

  async function togglePermission(role: Role, permission: Permission) {
    if (role.isSystem) return;
    const next = role.permissions.includes(permission) ? role.permissions.filter((p) => p !== permission) : [...role.permissions, permission];

    setState((s) => s.map((r) => (r.id === role.id ? { ...r, permissions: next } : r)));

    const res = await fetch(`/api/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: next }),
    });
    if (!res.ok) {
      toast.error("Couldn't update permission.");
      setState((s) => s.map((r) => (r.id === role.id ? role : r)));
    }
  }

  return (
    <div className="space-y-4">
      {state.map((role) => (
        <Card key={role.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                {role.name}
                {role.isSystem ? (
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3" /> System role
                  </Badge>
                ) : null}
              </CardTitle>
              <CardDescription>{role.isSystem ? "Owners always have full access." : "Choose what this role can do."}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {PERMISSIONS.map((permission) => (
                <label key={permission} className="flex items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={role.isSystem || role.permissions.includes(permission)}
                    disabled={role.isSystem}
                    onCheckedChange={() => togglePermission(role, permission)}
                  />
                  {PERMISSION_LABELS[permission]}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
