"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function accept() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't accept this invite.");
        return;
      }
      toast.success("You're in!");
      router.push(`/${data.workspaceSlug}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="lg" className="w-full" onClick={accept} loading={loading}>
      Accept invite
    </Button>
  );
}
