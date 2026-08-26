import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-brand p-10 text-white lg:flex">
        <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_60%,white,transparent_30%)]" />
        <Link href="/" className="relative z-10">
          <Logo className="text-white" markClassName="drop-shadow-sm" />
        </Link>
        <div className="relative z-10 max-w-md space-y-4">
          <p className="font-display text-3xl font-bold leading-tight text-balance">
            Your workplace, in one place.
          </p>
          <p className="text-white/85">
            Announcements, polls, schedules and team updates — one open-source home for how your team stays in sync.
          </p>
        </div>
        <p className="relative z-10 text-sm text-white/70">Free, open source, and yours to self-host.</p>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </Link>
          <div className="mb-8 space-y-1.5 text-center lg:text-left">
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
