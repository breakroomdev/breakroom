"use client";

import * as React from "react";
import Image from "next/image";
import { ExternalLink, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface RobloxProfile {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export function RobloxProfileTrigger({
  userId,
  username,
  displayName,
  children,
}: {
  userId: number;
  username: string;
  displayName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<RobloxProfile | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !profile) {
      setLoading(true);
      try {
        const res = await fetch(`/api/roblox/profile/${userId}?username=${encodeURIComponent(username)}&displayName=${encodeURIComponent(displayName)}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            {profile?.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="" width={72} height={72} className="rounded-full" unoptimized />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-brand-soft text-lg font-bold text-primary">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-display text-sm font-semibold">{profile?.displayName ?? displayName}</p>
              <p className="text-xs text-muted-foreground">@{profile?.username ?? username}</p>
              <p className="mt-1 text-xs text-muted-foreground">ID {userId}</p>
            </div>
            <a
              href={`https://www.roblox.com/users/${userId}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View Roblox profile <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
