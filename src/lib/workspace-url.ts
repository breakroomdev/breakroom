/**
 * Builds a URL that lands on a given workspace. When the app is configured with a
 * root domain (NEXT_PUBLIC_APP_URL, mirrored from APP_URL), this returns an absolute
 * subdomain URL ("https://acme.example.com/path"); otherwise it falls back to the
 * path-based route ("/acme/path") so path-only deployments keep working unchanged.
 */
export function workspaceUrl(slug: string, path: string = "/"): string {
  const suffix = path === "/" ? "" : path;

  try {
    const root = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "");
    const host = root.hostname.replace(/^www\./, "");
    const port = root.port ? `:${root.port}` : "";
    return `${root.protocol}//${slug}.${host}${port}${suffix}`;
  } catch {
    return `/${slug}${suffix}`;
  }
}

/** True if `url` is an absolute http(s) URL (i.e. crosses an origin, e.g. a subdomain). */
export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

/** Human-readable host for a workspace, for display only (e.g. "acme.example.com"). */
export function workspaceDisplayHost(slug: string): string {
  try {
    const root = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "");
    return `${slug}.${root.hostname.replace(/^www\./, "")}`;
  } catch {
    return typeof window !== "undefined" ? `${window.location.host}/${slug}` : `/${slug}`;
  }
}

/** Just the root host, for display (e.g. "example.com"). */
export function rootDisplayHost(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}
