import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { getMembership, type Membership } from "@/lib/auth/authorize";
import { AuthError } from "@/lib/auth/session";

/** Resolves the current user + their membership for :workspaceSlug, or throws AuthError. */
export async function requireWorkspaceContext(workspaceSlug: string): Promise<{ userId: string; membership: Membership }> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not authenticated");

  const membership = await getMembership(user.id, workspaceSlug);
  if (!membership) throw new AuthError("Not a member of this workspace");

  return { userId: user.id, membership };
}
