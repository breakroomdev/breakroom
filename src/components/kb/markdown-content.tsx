import Markdown from "markdown-to-jsx";

// Markdown link/image syntax still emits attacker-controlled hrefs/srcs even
// with raw HTML parsing disabled (e.g. `[click](javascript:alert(1))`), so
// URLs are explicitly allow-listed here regardless of disableParsingRawHTML.
const SAFE_URL = /^(https?:|mailto:|\/|#)/i;
function safeUrl(url?: string): string | undefined {
  return url && SAFE_URL.test(url) ? url : undefined;
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content">
      <Markdown
        options={{
          disableParsingRawHTML: true,
          overrides: {
            a: {
              component: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
                <a href={safeUrl(href)} target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </a>
              ),
            },
            img: {
              component: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) =>
                safeUrl(src) ? <img src={src} alt={alt} {...props} /> : null,
            },
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
