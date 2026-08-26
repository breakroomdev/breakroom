import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/auth/authorize";
import { ProfileForm } from "@/components/settings/profile-form";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { PasswordForm } from "@/components/settings/password-form";
import type { ColorMode } from "@/lib/theme";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ params }: { params: { workspaceSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id, params.workspaceSlug);
  if (!membership) redirect("/workspaces");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      <ProfileForm
        initial={{
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          jobTitle: user.jobTitle,
          department: user.department,
          pronouns: user.pronouns,
          phone: user.phone,
        }}
      />

      <AppearanceForm colorMode={user.colorMode as ColorMode} themeOverride={user.themeOverride} workspaceTheme={membership.workspace.theme} />

      <PasswordForm hasPassword={!!user.passwordHash} />
    </div>
  );
}
