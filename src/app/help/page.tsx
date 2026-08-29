import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { listHelpCategories } from "@/lib/services/help";
import { HelpBrowser } from "@/components/kb/help-browser";

export const metadata = { title: "Help Center" };

export default async function HelpIndexPage() {
  const categories = await listHelpCategories();

  return (
    <div>
      <MarketingNavbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight">Help Center</h1>
        <p className="mt-2 text-muted-foreground">Everything you need to know about using Breakroom.</p>
        <div className="mt-8">
          <HelpBrowser initialCategories={categories} />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
