import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { DiscordButton } from "@/components/auth/discord-button";

export const metadata = { title: "Create your account" };

export default function RegisterPage() {
  const discordEnabled = Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);

  return (
    <AuthShell title="Create your Breakroom" subtitle="Set up a free workspace for your team in a couple of minutes.">
      <div className="space-y-4">
        {discordEnabled ? (
          <>
            <DiscordButton label="Sign up with Discord" />
            <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        ) : null}
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
