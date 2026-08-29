const VIDEO_ID_RE = /^[\w-]{11}$/;

/** Extracts a YouTube video ID from a watch/youtu.be/shorts/embed URL, or null if not a recognizable YouTube link. */
export function extractYoutubeId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  let id: string | null = null;

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/") || url.pathname.startsWith("/live/")) {
      id = url.pathname.split("/")[2] ?? null;
    }
  } else if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  }

  return id && VIDEO_ID_RE.test(id) ? id : null;
}

/**
 * Rewrites any markdown line that's entirely a bare YouTube URL (or a link
 * whose visible text is that URL) into `[Video](internal-youtube:{id})`, an
 * internal marker intercepted by MarkdownContent's `a` override to render a
 * safe embed. Own-line only — deliberate scope cut, not a parser limitation.
 */
export function preprocessYoutubeEmbeds(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Bare URL on its own line, or `[url](url)`-shaped link text.
      const bareMatch = trimmed.match(/^(https?:\/\/\S+)$/);
      const linkMatch = trimmed.match(/^\[(https?:\/\/\S+)\]\(\1\)$/);
      const candidate = bareMatch?.[1] ?? linkMatch?.[1];
      if (!candidate) return line;

      const id = extractYoutubeId(candidate);
      if (!id) return line;

      return `[Video](internal-youtube:${id})`;
    })
    .join("\n");
}
