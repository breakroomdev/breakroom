import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const variantClasses = {
  primary:
    "bg-primary text-primary-foreground shadow-soft hover:brightness-105 active:brightness-95",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/70 border border-border",
  outline:
    "border border-border bg-transparent hover:bg-muted text-foreground",
  ghost: "hover:bg-muted text-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:brightness-105",
  link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
} as const;

const sizeClasses = {
  sm: "h-8 px-3 text-sm gap-1.5",
  default: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10 shrink-0",
  "icon-sm": "h-8 w-8 shrink-0",
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", asChild, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98]",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : null}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";
