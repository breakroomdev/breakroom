import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { NewWorkspaceForm } from "@/components/auth/new-workspace-form";

export const metadata = { title: "Create a workspace" };

export default async function NewWorkspacePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/new-workspace");

  return (
    <AuthShell title="Create a workspace" subtitle="This will be your team's home in Breakroom.">
      <NewWorkspaceForm />
    </AuthShell>
  );
}
