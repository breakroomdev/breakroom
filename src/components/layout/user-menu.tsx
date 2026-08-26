"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  workspaceSlug: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}

export function UserMenu({ workspaceSlug, name, username, avatarUrl, isAdmin }: UserMenuProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar name={name} src={avatarUrl} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{name}</span>
          <span className="font-normal text-muted-foreground">@{username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${workspaceSlug}/settings`}>
            <User className="h-4 w-4" />
            Your profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${workspaceSlug}/settings`}>
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href={`/${workspaceSlug}/admin`}>
              <ShieldCheck className="h-4 w-4" />
              Admin dashboard
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
