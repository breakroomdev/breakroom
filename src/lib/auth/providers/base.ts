/**
 * Common contract for OAuth SSO providers. Discord (./discord.ts) is the
 * only provider implemented today, but every login route is written
 * against this interface so Google/Microsoft/GitHub/etc can be added
 * later without touching the callback/session logic — just implement
 * OAuthProvider and register it in ./registry.ts.
 */

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthProfile {
  providerAccountId: string;
  email: string | null;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface OAuthProvider {
  key: string;
  displayName: string;
  getAuthorizationUrl(config: OAuthProviderConfig, state: string): string;
  exchangeCode(config: OAuthProviderConfig, code: string): Promise<{ accessToken: string }>;
  getProfile(accessToken: string): Promise<OAuthProfile>;
}
