"use client";

import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useWorkspace } from "@/components/workspace-context";

interface RoleOption {
  id: string;
  name: string;
}

export function InviteMemberDialog({ open, onOpenChange, roles }: { open: boolean; onOpenChange: (open: boolean) => void; roles: RoleOption[] }) {
  const { workspace } = useWorkspace();
  const [email, setEmail] = React.useState("");
  const [roleId, setRoleId] = React.useState(roles.find((r) => r.name === "Employee")?.id ?? roles[0]?.id ?? "");
  const [saving, setSaving] = React.useState(false);
  const [inviteUrl, setInviteUrl] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, roleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't send invite.");
        return;
      }
      setInviteUrl(data.inviteUrl);
      toast.success("Invite sent");
    } finally {
      setSaving(false);
    }
  }

  function close(open: boolean) {
    if (!open) {
      setEmail("");
      setInviteUrl(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a teammate</DialogTitle>
          <DialogDescription>They'll get an email with a link to join.</DialogDescription>
        </DialogHeader>

        {inviteUrl ? (
          <div className="space-y-3">
            <p className="rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">Invite created!</p>
            <Field label="Invite link" hint="You can also share this link directly.">
              <Input readOnly value={inviteUrl} onFocus={(e) => e.target.select()} />
            </Field>
            <DialogFooter>
              <Button onClick={() => close(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email" htmlFor="invite-email">
              <Input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Role" htmlFor="invite-role">
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Send invite
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
