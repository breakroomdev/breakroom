import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { Logo } from "@/components/brand/logo";
import { StaffNav } from "@/components/staff/staff-nav";

export const metadata = { title: "Staff" };

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isSiteAdmin) redirect("/workspaces");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/staff" className="flex items-center gap-2.5">
            <Logo />
            <span className="flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-800 dark:bg-primary-500/15 dark:text-primary-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Staff
            </span>
          </Link>
          <Link href="/workspaces" className="text-sm text-muted-foreground hover:text-foreground">
            Back to Breakroom
          </Link>
        </div>
        <div className="mx-auto max-w-5xl px-6">
          <StaffNav />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
