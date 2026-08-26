import { NextResponse } from "next/server";
import { getOAuthProvider } from "@/lib/auth/providers/registry";
import { resolveDiscordConfig, OAUTH_STATE_COOKIE } from "@/lib/auth/discord-config";
import { generateToken } from "@/lib/auth/tokens";
import { jsonError } from "@/lib/api/response";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const workspaceSlug = url.searchParams.get("workspace");

  const provider = getOAuthProvider("discord");
  if (!provider) return jsonError("Discord login is not available", 500);

  const config = await resolveDiscordConfig(workspaceSlug);
  if (!config) return jsonError("Discord login is not configured for this workspace.", 400);

  const nonce = generateToken(16);
  const state = `${nonce}.${workspaceSlug ?? ""}`;

  const authUrl = provider.getAuthorizationUrl(config, state);
  const res = NextResponse.redirect(authUrl);
  res.cookies.set(OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
