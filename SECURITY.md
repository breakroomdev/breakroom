# Security Policy

Breakroom handles authentication, personal data, and (optionally) OAuth
credentials for real teams, so we take security seriously — both in the
software itself and in how self-hosters deploy it.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead:

1. Use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
   on this repository ("Security" tab → "Report a vulnerability"), or
2. Email the maintainers with details (what you found, how to reproduce it,
   and its potential impact).

We'll acknowledge your report within a few days and keep you updated as we
investigate and fix the issue. We ask that you give us a reasonable window to
patch the vulnerability before any public disclosure.

## Supported Versions

Breakroom does not yet have a formal LTS/release process — security fixes are
applied to the `main` branch. Self-hosters should track `main` (or tagged
releases, once they exist) and update regularly.

## Built-in Security Practices

For context when auditing this project:

- Passwords are hashed with bcrypt (never stored or logged in plaintext).
- Sessions use random, hashed tokens in httpOnly, secure, SameSite=Lax cookies.
- All permission checks are enforced server-side (`lib/auth/authorize.ts`),
  never trusted from the client.
- Request bodies are validated with Zod schemas before touching the database.
- Database access goes through Drizzle's parameterized queries — no raw SQL
  string concatenation.
- State-changing API routes verify the request `Origin` as CSRF defense in
  depth, on top of SameSite cookies.
- Sensitive endpoints (login, register, password reset) are rate-limited.
- OAuth client secrets (Discord) are stored and used server-side only, never
  sent to the browser.
- File uploads go through signed, size- and type-limited Cloudinary requests.

## Reporting Issues With a Deployment (Not the Code)

If you've misconfigured your own instance (leaked `.env`, exposed database,
etc.), that's outside this policy — please rotate your secrets and redeploy.
