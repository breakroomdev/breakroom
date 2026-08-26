/** Generates a URL-safe random token (used for session ids, reset tokens, invites). */
export function generateToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Buffer.from(arr).toString("base64url");
}

/** SHA-256 hashes a token so raw tokens never touch the database. */
export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("hex");
}
