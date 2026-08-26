import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="space-y-2">
        <p className="font-display text-6xl font-bold text-primary">404</p>
        <h1 className="font-display text-xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">The page you're looking for doesn't exist or may have moved.</p>
      </div>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
