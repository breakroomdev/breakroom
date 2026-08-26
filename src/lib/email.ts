import "server-only";

/**
 * Pluggable email sender. Breakroom doesn't bundle a specific email
 * provider (Postmark, Resend, SES, SMTP, ...) since self-hosters will
 * have their own preference. By default this just logs to the console
 * so the password-reset and invite flows work end-to-end in development.
 * Swap the body of this function for a real provider in production.
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.warn(
      `[email] No email provider configured — logging instead of sending.\nTo: ${to}\nSubject: ${subject}\n\n${body}`
    );
  } else {
    console.log(`\n📧  Email to ${to}\nSubject: ${subject}\n${body}\n`);
  }
}
