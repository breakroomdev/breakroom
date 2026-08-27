import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { workspaceUrl } from "@/lib/workspace-url";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Logo } from "@/components/brand/logo";
import { WorkspaceLogo } from "@/components/brand/workspace-logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { Plus, ArrowRight } from "lucide-react";

export const metadata = { title: "Your workspaces" };

export default async function WorkspacesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = await getDb();
  const memberships = await db
    .select({ workspace: schema.workspaces, role: schema.roles })
    .from(schema.workspaceMembers)
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.workspaceMembers.workspaceId))
    .innerJoin(schema.roles, eq(schema.roles.id, schema.workspaceMembers.roleId))
    .where(eq(schema.workspaceMembers.userId, user.id));

  if (memberships.length === 1) {
    redirect(workspaceUrl(memberships[0]!.workspace.slug));
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-12">
      <div className="mb-10 flex items-center justify-between">
        <Logo />
        <LogoutButton />
      </div>

      <h1 className="font-display text-2xl font-bold tracking-tight">Your workspaces</h1>
      <p className="mt-1 text-muted-foreground">Pick a workspace to jump back in.</p>

      <div className="mt-8 space-y-3">
        {memberships.map(({ workspace, role }) => (
          <Link key={workspace.id} href={workspaceUrl(workspace.slug)}>
            <Card className="group transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <WorkspaceLogo name={workspace.name} logoUrl={workspace.logoUrl} size="lg" />
                  <div>
                    <p className="font-medium">{workspace.name}</p>
                    <p className="text-sm capitalize text-muted-foreground">{role.name}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}

        {memberships.length === 0 ? (
          <EmptyState
            icon="👋"
            title="No workspaces yet"
            description="Create a workspace for your team, or ask a teammate to invite you to theirs."
          />
        ) : null}
      </div>

      <Button asChild size="lg" className="mt-6 w-full">
        <Link href="/new-workspace">
          <Plus className="h-4 w-4" />
          Create a workspace
        </Link>
      </Button>
    </div>
  );
}
