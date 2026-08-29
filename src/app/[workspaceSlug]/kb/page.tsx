import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { listKbArticles } from "@/lib/services/kb";
import { KbBrowser } from "@/components/kb/kb-browser";

export const metadata = { title: "Knowledge Base" };

export default async function KbIndexPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  const articles = await listKbArticles(membership.workspace.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground">Docs, SOPs, and onboarding info for {membership.workspace.name}.</p>
      </div>
      <KbBrowser
        initialArticles={articles.map((a) => ({ id: a.id, title: a.title, slug: a.slug, category: a.category, updatedAt: a.updatedAt.getTime() }))}
      />
    </div>
  );
}
