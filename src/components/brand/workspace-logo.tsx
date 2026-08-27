import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "h-6 w-6", text: "text-xs", px: 24 },
  md: { box: "h-8 w-8", text: "text-sm", px: 32 },
  lg: { box: "h-11 w-11", text: "text-lg", px: 44 },
} as const;

/** Square workspace mark: the workspace's uploaded logo if it has one, otherwise a gradient initial — used anywhere a workspace needs to be visually identified (switcher, header, workspace lists). */
export function WorkspaceLogo({ name, logoUrl, size = "md", className }: { name: string; logoUrl?: string | null; size?: keyof typeof SIZES; className?: string }) {
  const { box, text, px } = SIZES[size];

  if (logoUrl) {
    return (
      <span className={cn("relative shrink-0 overflow-hidden rounded-lg bg-muted", box, className)}>
        {/* Persistent nav chrome, rendered on every page — load it eagerly rather than
            deferring to the lazy-load/intersection heuristics meant for feed content. */}
        <Image src={logoUrl} alt="" fill sizes={`${px}px`} priority className="object-cover" />
      </span>
    );
  }

  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-lg bg-gradient-brand font-display font-bold text-white", box, text, className)}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
