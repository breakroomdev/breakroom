import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { workspaceUrl } from "@/lib/workspace-url";
import { Button } from "@/components/ui/button";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { HeroShowcase, ShowcaseSection } from "@/components/marketing/showcase";
import { FeatureGrid, HowItWorksSection } from "@/components/marketing/feature-grid";
import { ThemeShowcase } from "@/components/marketing/theme-showcase";
import { CTASection, MarketingFooter } from "@/components/marketing/footer";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    const db = await getDb();
    const membership = await db.query.workspaceMembers.findFirst({ where: eq(schema.workspaceMembers.userId, user.id) });
    if (membership) {
      const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, membership.workspaceId) });
      if (workspace) redirect(workspaceUrl(workspace.slug));
    }
    redirect("/workspaces");
  }

  return (
    <div>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <MarketingNavbar />

      <main id="main-content">
        <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
          <div className="pointer-events-none absolute -left-32 -top-32 -z-10 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[110px]" />
          <div className="pointer-events-none absolute -right-24 top-40 -z-10 h-[380px] w-[380px] rounded-full bg-accent/20 blur-[110px]" />

          <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
                <span className="flex h-1.5 w-1.5 rounded-full bg-success" /> Built for modern teams
              </div>
              <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-6xl">
                Your workplace, <span className="bg-gradient-brand bg-clip-text text-transparent">in one place.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground text-balance lg:mx-0">
                Breakroom brings workplace communication, schedules, polls and team updates together in one simple,
                focused platform.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Get started <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>

            <HeroShowcase />
          </div>
        </section>

        <FeatureGrid />
        <ShowcaseSection />
        <ThemeShowcase />
        <HowItWorksSection />
        <CTASection />
      </main>
      <MarketingFooter />
    </div>
  );
}
