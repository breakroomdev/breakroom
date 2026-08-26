"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, initials } from "@/lib/utils";

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
} as const;

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}

const GRADIENTS = [
  "from-primary-400 to-accent",
  "from-accent to-primary-600",
  "from-primary-300 to-primary-700",
  "from-primary-500 to-accent",
];

function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export function Avatar({ src, name, size = "md", className, ring }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full",
        SIZES[size],
        ring && "ring-2 ring-background",
        className
      )}
    >
      <AvatarPrimitive.Image src={src ?? undefined} alt={name} className="h-full w-full object-cover" />
      <AvatarPrimitive.Fallback
        className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br font-semibold text-white", gradientFor(name))}
        delayMs={src ? 300 : 0}
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
