import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small checkmark shown next to a workspace's name once staff have verified it as official. */
export function VerifiedBadge({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <BadgeCheck
      aria-label="Verified by Breakroom"
      className={cn("shrink-0 fill-primary text-primary-foreground", className)}
      width={size}
      height={size}
    />
  );
}
