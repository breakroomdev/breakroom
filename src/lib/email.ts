import "server-only";
import { Resend } from "resend";

/**
 * Pluggable email sender. Breakroom doesn't hard-depend on a specific
 * email provider — self-hosters without RESEND_API_KEY set still get a
 * working password-reset/invite flow via the console-log fallback below.
 * Set RESEND_API_KEY (and optionally EMAIL_FROM) to actually deliver mail
 * through Resend: https://resend.com.
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        `[email] No email provider configured — logging instead of sending.\nTo: ${to}\nSubject: ${subject}\n\n${body}`
      );
    } else {
      console.log(`\n📧  Email to ${to}\nSubject: ${subject}\n${body}\n`);
    }
    return;
  }

  const from = process.env.EMAIL_FROM || "Breakroom <onboarding@resend.dev>";
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    text: body,
    html: bodyToHtml(body),
  });

  if (error) {
    // Don't throw — callers (password reset, invites) already handle the
    // "email didn't go out" case gracefully (a generic success response, or
    // an inviteUrl returned in the API response as a fallback), so a
    // delivery failure here shouldn't break the request.
    console.error(`[email] Resend failed to send to ${to}: ${error.message}`);
  }
}

/** Minimal plain-text-to-HTML conversion — preserves line breaks and auto-links URLs. */
function bodyToHtml(body: string): string {
  const escaped = body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const linked = escaped.replace(/(https?:\/\/\S+)/g, '<a href="$1">$1</a>');
  return `<div style="font-family: sans-serif; font-size: 15px; line-height: 1.6; color: #111;">${linked.replace(/\n/g, "<br>")}</div>`;
}
