import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center animate-fade-in", className)}>
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand-soft text-2xl">{icon}</div>
      ) : null}
      <div className="space-y-1">
        <p className="font-display text-base font-semibold text-foreground">{title}</p>
        {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
