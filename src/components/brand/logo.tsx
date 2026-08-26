import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-8 w-8", className)} aria-hidden="true">
      <rect width="64" height="64" rx="18" className="fill-primary" />
      <rect x="13" y="13" width="38" height="38" rx="13" className="fill-primary-foreground" />
      <rect x="24" y="23" width="6" height="18" rx="3" className="fill-primary" />
      <rect x="34" y="23" width="6" height="18" rx="3" className="fill-primary" />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-bold tracking-tight", className)}>
      <LogoMark className={markClassName} />
      Breakroom
    </span>
  );
}
