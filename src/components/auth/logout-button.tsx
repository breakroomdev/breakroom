"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton({ variant = "ghost" }: { variant?: "ghost" | "secondary" }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant={variant} size="sm" onClick={logout}>
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
