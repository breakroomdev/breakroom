import { listHelpArticles } from "@/lib/services/help";
import { StaffHelpArticlesManager } from "@/components/staff/staff-help-articles-manager";

export const metadata = { title: "Help Articles · Staff" };

export default async function StaffHelpArticlesPage() {
  const articles = await listHelpArticles({ includeUnpublished: true });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Help Articles</h1>
        <p className="text-muted-foreground">The public help center — how to use Breakroom, for everyone on this instance.</p>
      </div>
      <StaffHelpArticlesManager
        initialArticles={articles.map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          category: a.category,
          status: a.status,
          updatedAt: a.updatedAt.getTime(),
        }))}
      />
    </div>
  );
}
