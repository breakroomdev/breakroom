const KB_LINK_RE = /\/kb\/([a-z0-9]+(?:-[a-z0-9]+)*)/;
const HELP_LINK_RE = /\/help\/([a-z0-9]+(?:-[a-z0-9]+)*)/;

/**
 * Detects the first Knowledge Base or Help Center article link in a block of
 * text (relative path, workspace-relative, or full absolute URL — only the
 * path segment matters, the host is ignored). Resolution always happens
 * against the *posting* workspace's own ID at the call site, so this can
 * never leak cross-workspace content — at worst a harmless false-positive
 * match if someone pastes a different workspace's URL with the same slug.
 */
export function detectArticleLink(content: string): { kind: "kb" | "help"; slug: string } | null {
  const kbMatch = content.match(KB_LINK_RE);
  if (kbMatch?.[1]) return { kind: "kb", slug: kbMatch[1] };

  const helpMatch = content.match(HELP_LINK_RE);
  if (helpMatch?.[1]) return { kind: "help", slug: helpMatch[1] };

  return null;
}
