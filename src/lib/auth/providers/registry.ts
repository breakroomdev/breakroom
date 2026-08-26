import type { OAuthProvider } from "./base";
import { discordProvider } from "./discord";

const providers: Record<string, OAuthProvider> = {
  discord: discordProvider,
};

export function getOAuthProvider(key: string): OAuthProvider | null {
  return providers[key] ?? null;
}
