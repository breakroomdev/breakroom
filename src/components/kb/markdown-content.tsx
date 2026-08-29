import Markdown from "markdown-to-jsx";
import { preprocessYoutubeEmbeds } from "@/lib/youtube";

// Markdown link/image syntax still emits attacker-controlled hrefs/srcs even
// with raw HTML parsing disabled (e.g. `[click](javascript:alert(1))`), so
// URLs are explicitly allow-listed here regardless of disableParsingRawHTML.
const SAFE_URL = /^(https?:|mailto:|\/|#)/i;
function safeUrl(url?: string): string | undefined {
  return url && SAFE_URL.test(url) ? url : undefined;
}

const YOUTUBE_ID_RE = /^[\w-]{11}$/;
const YOUTUBE_MARKER = "internal-youtube:";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content">
      <Markdown
        options={{
          disableParsingRawHTML: true,
          overrides: {
            a: {
              component: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
                if (href?.startsWith(YOUTUBE_MARKER)) {
                  const id = href.slice(YOUTUBE_MARKER.length);
                  // Re-validated here even though preprocessYoutubeEmbeds already
                  // validated it — this override is the actual trust boundary
                  // that decides whether an iframe gets built, so it must not
                  // trust its caller.
                  if (YOUTUBE_ID_RE.test(id)) {
                    return (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${id}`}
                        title="YouTube video"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ aspectRatio: "16 / 9", width: "100%", border: 0 }}
                      />
                    );
                  }
                  return null;
                }
                return (
                  <a href={safeUrl(href)} target="_blank" rel="noopener noreferrer" {...props}>
                    {children}
                  </a>
                );
              },
            },
            img: {
              component: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) =>
                safeUrl(src) ? <img src={src} alt={alt} {...props} /> : null,
            },
          },
        }}
      >
        {preprocessYoutubeEmbeds(content)}
      </Markdown>
    </div>
  );
}
