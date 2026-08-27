import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-brand px-8 py-16 text-center text-white sm:px-16">
        <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_15%_20%,white,transparent_35%),radial-gradient(circle_at_85%_70%,white,transparent_30%)]" />
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">Ready to bring your team together?</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">Set up your workspace in minutes — no credit card, no catch.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" asChild className="bg-white text-primary-700 hover:bg-white/90">
              <Link href="/register">
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <Logo />
        <p className="text-sm text-muted-foreground">Your workplace, in one place.</p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
