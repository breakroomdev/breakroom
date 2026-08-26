import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-primary-100 text-primary-800",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border text-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  destructive: "bg-destructive/15 text-destructive",
  accent: "bg-accent/15 text-accent-foreground",
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
