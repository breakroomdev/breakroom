import type { OAuthProvider, OAuthProviderConfig, OAuthProfile } from "./base";

const DISCORD_API = "https://discord.com/api/v10";

export const discordProvider: OAuthProvider = {
  key: "discord",
  displayName: "Discord",

  getAuthorizationUrl(config: OAuthProviderConfig, state: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: "identify email",
      state,
      prompt: "consent",
    });
    return `https://discord.com/oauth2/authorize?${params.toString()}`;
  },

  async exchangeCode(config: OAuthProviderConfig, code: string) {
    const res = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!res.ok) {
      throw new Error(`Discord token exchange failed: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as { access_token: string };
    return { accessToken: data.access_token };
  },

  async getProfile(accessToken: string): Promise<OAuthProfile> {
    const res = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Discord profile fetch failed: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as {
      id: string;
      username: string;
      global_name: string | null;
      email: string | null;
      avatar: string | null;
    };

    const avatarUrl = data.avatar
      ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=256`
      : null;

    return {
      providerAccountId: data.id,
      email: data.email,
      username: data.username,
      displayName: data.global_name ?? data.username,
      avatarUrl,
    };
  },
};
