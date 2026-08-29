import "server-only";
import { Resend } from "resend";

const BRAND_GREEN = "#1DB491";

export interface EmailContent {
  /** Short, direct — e.g. "Reset your password". Rendered as the email's H1. */
  heading: string;
  /** Body copy, one entry per paragraph. Treated as plain text (HTML-escaped). */
  paragraphs: string[];
  /** Optional call-to-action button, e.g. a reset/invite link. */
  cta?: { label: string; url: string };
  /** Small print at the bottom. Defaults to a generic automated-message note. */
  footer?: string;
}

const DEFAULT_FOOTER = "This is an automated message from Breakroom. If you weren't expecting it, you can safely ignore it.";

/**
 * Pluggable email sender. Breakroom doesn't hard-depend on a specific
 * email provider — self-hosters without RESEND_API_KEY set still get a
 * working password-reset/invite flow via the console-log fallback below.
 * Set RESEND_API_KEY (and optionally EMAIL_FROM) to actually deliver mail
 * through Resend: https://resend.com.
 */
export async function sendEmail(to: string, subject: string, content: EmailContent): Promise<void> {
  const { html, text } = renderEmail(content);
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.warn(`[email] No email provider configured — logging instead of sending.\nTo: ${to}\nSubject: ${subject}\n\n${text}`);
    } else {
      console.log(`\n📧  Email to ${to}\nSubject: ${subject}\n${text}\n`);
    }
    return;
  }

  const from = process.env.EMAIL_FROM || "Breakroom <onboarding@resend.dev>";
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({ from, to, subject, text, html });

  if (error) {
    // Don't throw — callers (password reset, invites) already handle the
    // "email didn't go out" case gracefully (a generic success response, or
    // an inviteUrl returned in the API response as a fallback), so a
    // delivery failure here shouldn't break the request.
    console.error(`[email] Resend failed to send to ${to}: ${error.message}`);
  }
}

function escapeHtml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderEmail({ heading, paragraphs, cta, footer = DEFAULT_FOOTER }: EmailContent): { html: string; text: string } {
  const paragraphsHtml = paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563;">${escapeHtml(p)}</p>`)
    .join("");

  const ctaHtml = cta
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
        <tr>
          <td style="border-radius:10px;background-color:${BRAND_GREEN};">
            <a href="${cta.url}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(cta.label)}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;">Or paste this link into your browser:</p>
      <p style="margin:0 0 20px;font-size:13px;color:${BRAND_GREEN};word-break:break-all;"><a href="${cta.url}" style="color:${BRAND_GREEN};">${cta.url}</a></p>`
    : "";

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #f0f0f0;">
                <span style="font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.02em;">Break<span style="color:${BRAND_GREEN};">room</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">${escapeHtml(heading)}</h1>
                ${paragraphsHtml}
                ${ctaHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background-color:#fafafa;border-top:1px solid #f0f0f0;border-radius:0 0 16px 16px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">${escapeHtml(footer)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [heading, "", ...paragraphs, cta ? `\n${cta.label}: ${cta.url}` : "", "", footer].filter((line) => line !== "").join("\n");

  return { html, text };
}
