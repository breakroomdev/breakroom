"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="space-y-2">
        <p className="text-4xl">😕</p>
        <h1 className="font-display text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-sm text-muted-foreground">
          An unexpected error occurred. Try again, and if it keeps happening, let your workspace admin know.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={reset}>
          Try again
        </Button>
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
