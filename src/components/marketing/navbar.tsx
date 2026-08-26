import Link from "next/link";
import { Github } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#themes" className="hover:text-foreground">
            Themes
          </a>
          <a href="#open-source" className="hover:text-foreground">
            Open source
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Github className="h-4 w-4" /> GitHub
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
