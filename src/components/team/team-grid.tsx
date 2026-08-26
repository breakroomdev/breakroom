"use client";

import * as React from "react";
import { Mail, Phone, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TeamMember } from "@/lib/services/team";

export function TeamGrid({ members }: { members: TeamMember[] }) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState<TeamMember | null>(null);

  const filtered = members.filter((m) => {
    const q = query.toLowerCase();
    return (
      m.displayName.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      m.department?.toLowerCase().includes(q) ||
      m.jobTitle?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <Input placeholder="Search by name, role, or department…" value={query} onChange={(e) => setQuery(e.target.value)} className="mb-6 max-w-sm" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((member) => (
          <Card key={member.id} className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-card-hover" onClick={() => setActive(member)}>
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar name={member.displayName} src={member.avatarUrl} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-medium">{member.displayName}</p>
                <p className="truncate text-sm text-muted-foreground">{member.jobTitle || `@${member.username}`}</p>
                <Badge variant="secondary" className="mt-1.5 capitalize">
                  {member.role.name}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent>
          {active ? (
            <>
              <DialogHeader className="items-center text-center">
                <Avatar name={active.displayName} src={active.avatarUrl} size="xl" className="mb-3" />
                <DialogTitle>{active.displayName}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  @{active.username} {active.pronouns ? `· ${active.pronouns}` : ""}
                </p>
              </DialogHeader>
              <div className="space-y-3">
                {active.bio ? <p className="text-center text-sm text-foreground/90">{active.bio}</p> : null}
                <div className="flex flex-wrap justify-center gap-2">
                  {active.jobTitle ? <Badge variant="outline">{active.jobTitle}</Badge> : null}
                  {active.department ? (
                    <Badge variant="outline">
                      <Building2 className="h-3 w-3" /> {active.department}
                    </Badge>
                  ) : null}
                  <Badge variant="secondary" className="capitalize">
                    {active.role.name}
                  </Badge>
                </div>
                <div className="space-y-1.5 rounded-lg border border-border p-3 text-sm">
                  <a href={`mailto:${active.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                    <Mail className="h-3.5 w-3.5" /> {active.email}
                  </a>
                  {active.phone ? (
                    <a href={`tel:${active.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                      <Phone className="h-3.5 w-3.5" /> {active.phone}
                    </a>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
