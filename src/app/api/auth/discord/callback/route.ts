import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getOAuthProvider } from "@/lib/auth/providers/registry";
import { resolveDiscordConfig, OAUTH_STATE_COOKIE } from "@/lib/auth/discord-config";
import { createSession } from "@/lib/auth/session";
import { addMemberToWorkspace, generateUniqueUsername } from "@/lib/workspace-service";
import { workspaceUrl } from "@/lib/workspace-url";

function errorRedirect(req: Request, message: string) {
  const url = new URL("/login", req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const nonceCookie = cookies().get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !nonceCookie) return errorRedirect(req, "Missing OAuth parameters.");

  const [stateNonce, workspaceSlug] = state.split(".");
  if (stateNonce !== nonceCookie) return errorRedirect(req, "Invalid OAuth state. Please try again.");

  const provider = getOAuthProvider("discord");
  if (!provider) return errorRedirect(req, "Discord login is unavailable.");

  const config = await resolveDiscordConfig(workspaceSlug || null);
  if (!config) return errorRedirect(req, "Discord login is not configured.");

  try {
    const { accessToken } = await provider.exchangeCode(config, code);
    const profile = await provider.getProfile(accessToken);
    const db = await getDb();

    let oauthAccount = await db.query.oauthAccounts.findFirst({
      where: eq(schema.oauthAccounts.providerAccountId, profile.providerAccountId),
    });

    let userId: string;

    if (oauthAccount) {
      userId = oauthAccount.userId;
    } else {
      let user = profile.email
        ? await db.query.users.findFirst({ where: eq(schema.users.email, profile.email.toLowerCase()) })
        : undefined;

      if (!user) {
        const username = await generateUniqueUsername(profile.username);
        const [created] = await db
          .insert(schema.users)
          .values({
            email: profile.email?.toLowerCase() ?? `${profile.providerAccountId}@discord.breakroom.local`,
            username,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
          })
          .returning();
        if (!created) throw new Error("Failed to create user from Discord profile");
        user = created;
      }

      await db.insert(schema.oauthAccounts).values({
        userId: user.id,
        provider: "discord",
        providerAccountId: profile.providerAccountId,
        providerUsername: profile.username,
      });

      userId = user.id;
    }

    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!user || user.disabledAt) return errorRedirect(req, "This account is disabled.");

    let redirectPath = "/workspaces";
    if (workspaceSlug) {
      const workspace = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.slug, workspaceSlug), with: { settings: true } });
      if (workspace) {
        const settings = workspace.settings;
        const existingMembership = await db.query.workspaceMembers.findFirst({
          where: (m, { and, eq }) => and(eq(m.workspaceId, workspace.id), eq(m.userId, userId)),
        });
        if (!existingMembership) {
          if (settings?.allowSelfRegistration === false) {
            return errorRedirect(req, "This workspace requires an invite to join.");
          }
          await addMemberToWorkspace(workspace.id, userId, "employee");
        }
        redirectPath = workspaceUrl(workspace.slug);
      }
    }

    await createSession(userId);
    const res = NextResponse.redirect(new URL(redirectPath, req.url));
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  } catch (err) {
    console.error(err);
    return errorRedirect(req, "Discord sign-in failed. Please try again.");
  }
}
