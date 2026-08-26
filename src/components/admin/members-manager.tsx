"use client";

import * as React from "react";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InviteMemberDialog } from "@/components/admin/invite-member-dialog";

interface Member {
  id: string;
  status: "active" | "disabled";
  joinedAt: number;
  user: { id: string; displayName: string; username: string; email: string; avatarUrl: string | null };
  role: { id: string; key: string; name: string };
}

interface RoleOption {
  id: string;
  key: string;
  name: string;
}

export function MembersManager({ initialMembers, roles, ownerId, currentUserId }: { initialMembers: Member[]; roles: RoleOption[]; ownerId: string; currentUserId: string }) {
  const [members, setMembers] = React.useState(initialMembers);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<Member | null>(null);

  async function changeRole(member: Member, roleId: string) {
    setMembers((m) => m.map((x) => (x.id === member.id ? { ...x, role: roles.find((r) => r.id === roleId) ?? x.role } : x)));
    const res = await fetch(`/api/members/${member.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roleId }) });
    if (!res.ok) toast.error("Couldn't update role.");
  }

  async function toggleStatus(member: Member) {
    const nextStatus = member.status === "active" ? "disabled" : "active";
    setMembers((m) => m.map((x) => (x.id === member.id ? { ...x, status: nextStatus } : x)));
    const res = await fetch(`/api/members/${member.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
    if (!res.ok) toast.error("Couldn't update account.");
    else toast.success(nextStatus === "disabled" ? "Account disabled" : "Account enabled");
  }

  async function removeMember() {
    if (!removeTarget) return;
    const res = await fetch(`/api/members/${removeTarget.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't remove member.");
    } else {
      setMembers((m) => m.filter((x) => x.id !== removeTarget.id));
      toast.success("Member removed");
    }
    setRemoveTarget(null);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> Invite member
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isOwner = member.user.id === ownerId;
            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={member.user.displayName} src={member.user.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{member.user.displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {isOwner ? (
                    <Badge variant="secondary">Owner</Badge>
                  ) : (
                    <Select value={member.role.id} onValueChange={(v) => changeRole(member, v)}>
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.filter((r) => r.key !== "owner").map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  {isOwner ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={member.status === "active"} onCheckedChange={() => toggleStatus(member)} />
                      {member.status === "active" ? "Active" : "Disabled"}
                    </label>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!isOwner && member.user.id !== currentUserId ? (
                    <Button variant="ghost" size="icon-sm" onClick={() => setRemoveTarget(member)} aria-label="Remove member">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} roles={roles.filter((r) => r.key !== "owner")} />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={`Remove ${removeTarget?.user.displayName}?`}
        description="They'll lose access to this workspace immediately."
        confirmLabel="Remove member"
        onConfirm={removeMember}
      />
    </div>
  );
}
