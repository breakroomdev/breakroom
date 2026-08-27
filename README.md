<p align="center">
  <img src="public/favicon.svg" width="72" height="72" alt="Breakroom logo" />
</p>

<h1 align="center">Breakroom</h1>
<p align="center"><strong>Your workplace, in one place.</strong></p>
<p align="center">
  Breakroom brings workplace communication, schedules, polls and team updates together in one
  simple, open-source platform. Free, self-hostable, and built to feel like a real product.
</p>

---

## What is Breakroom?

Breakroom is an open-source employee communication and workplace management platform: a
company feed, shift scheduling, polls, a team directory, and notifications — all in one
polished, self-hostable app. It's built for small-to-medium teams (retail, hospitality,
offices, remote teams) who want something more personal than a generic chat tool and less
heavyweight than enterprise HR software.

> **Status:** actively developed. Core features (auth, feed, polls, scheduling, team
> directory, notifications, admin, theming) are implemented and functional. See
> [Roadmap](#roadmap) for what's next.

## Features

- **Feed** — text, photo, announcement, and poll posts, with reactions, threaded comments,
  pinning, editing, and reporting.
- **Polls** — single- or multiple-choice, optional expiry, live results with percentage bars,
  duplicate-vote prevention.
- **Image uploads** — direct-to-Cloudinary uploads with previews, progress, and validation.
- **Hub** — admins curate a list of links to tools/docs/dashboards; each one opens inline as
  an in-page embed or in a new tab.
- **Shift scheduling** — day/week/month calendar views, assign shifts to employees, open/
  unassigned shifts, positions & locations, "my shifts" filter, "upcoming shifts" on the
  dashboard.
- **Team directory** — profile photos, job titles, departments, pronouns, and contact info,
  with search.
- **Notifications** — in-app bell with unread counts, mark-as-read, and a full notifications
  page, for comments, reactions, mentions, shift changes, and poll activity.
- **Admin dashboard** — workspace stats, member management (invite/remove/role/disable),
  custom role permissions, positions & locations, moderation queue for reports, and
  authentication configuration.
- **Multi-workspace** — one account can belong to multiple workspaces, each with its own
  members, roles, and settings.
- **Roles & permissions** — Owner / Admin / Manager / Employee by default, fully custom
  per-permission for Admin/Manager, enforced server-side.
- **Authentication** — username/password (bcrypt-hashed) and Discord OAuth2 SSO, built on a
  provider abstraction so more providers (Google, Microsoft, GitHub, ...) can be added later.
- **Themes** — 7 color themes (Default, Ocean, Sunset, Forest, Lavender, Berry, Slate) × light
  / dark / system mode, set per-workspace with per-user overrides, all via CSS variables.
- **Open source & self-hostable** — MIT licensed, no proprietary backend, deployable to
  Cloudflare, Vercel, or any Node host.
- **Staff panel** — instance-wide admin at `/staff` for whoever runs the deployment (gated by
  a per-user `isSiteAdmin` flag, not tied to any one workspace): browse every workspace, mark
  one "verified" (a checkmark shown next to its name), permanently delete a workspace, and
  broadcast an announcement notification to every member of every workspace.

## Tech stack

| Layer            | Choice                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| Framework         | [Next.js 14](https://nextjs.org) (App Router, TypeScript)              |
| Styling           | [Tailwind CSS](https://tailwindcss.com) + a small custom design system |
| UI primitives     | [Radix UI](https://www.radix-ui.com/) (accessible dialogs, menus, etc.) |
| Database          | SQLite-family — [Cloudflare D1](https://developers.cloudflare.com/d1/) on Cloudflare, [libSQL](https://turso.tech) (local file or [Turso](https://turso.tech)) everywhere else |
| ORM               | [Drizzle ORM](https://orm.drizzle.team) + Drizzle Kit for migrations   |
| Validation        | [Zod](https://zod.dev)                                                 |
| Image hosting     | [Cloudinary](https://cloudinary.com) (direct signed uploads)           |
| Auth              | Custom session auth (bcrypt) + Discord OAuth2                          |
| Toasts            | [sonner](https://sonner.emilkowal.ski/)                                |

Chosen for the cleanest combined Cloudflare + Vercel + local-dev story: the app talks to one
SQLite-shaped schema everywhere, swapping only the driver (D1 vs. libSQL) based on where it's
deployed.

## Project structure

```
src/
  app/                 Routes: marketing pages, auth, [workspaceSlug]/*, api/*
  components/          UI design system + feature components
  lib/
    db/                Drizzle schema + database client abstraction
    auth/              Sessions, password hashing, OAuth provider abstraction
    services/          Server-side data access used by pages & routes
    validation/        Zod schemas
scripts/               Migration runner + demo data seed script
drizzle/               Generated SQL migrations
```

## Local development

Requirements: Node.js 20+.

```bash
git clone https://github.com/breakroomdev/breakroom.git
cd breakroom
npm install
cp .env.example .env          # then fill in SESSION_SECRET at minimum
npm run db:generate           # generate SQL migrations from the schema
npm run db:migrate            # apply them to a local SQLite file
npm run db:seed               # optional: demo workspace, users, posts, polls, shifts
npm run dev
```

Visit `http://localhost:3000`. If you ran `db:seed`, sign in at `/login` with username
`jordan` (or `sam`, `casey`, `alex`, `morgan`, `taylor`, `jamie`) and password
`password123`, inside workspace `acme`.

### Production build

```bash
npm run build
npm run start
```

## Environment variables

See [`.env.example`](.env.example) for the full list with descriptions. The essentials:

| Variable | Required | Notes |
| --- | --- | --- |
| `APP_URL` | Yes | Public URL of your deployment (used for links, OAuth redirects). |
| `SESSION_SECRET` | Yes | Random string for session security. `openssl rand -base64 32`. |
| `DATABASE_URL` | Yes | `file:./sqlite.db` locally, `libsql://...` for Turso, unused on Cloudflare (uses the D1 binding instead). |
| `DATABASE_AUTH_TOKEN` | If using Turso | Turso auth token. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | For image uploads | From your [Cloudinary dashboard](https://cloudinary.com/console). |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` / `DISCORD_REDIRECT_URI` | For instance-wide Discord login | Workspace admins can also set their own from Admin → Authentication. |

## Discord SSO setup

1. Create an application at the [Discord Developer Portal](https://discord.com/developers/applications).
2. Under **OAuth2**, add a redirect URL: `https://your-domain.com/api/auth/discord/callback`.
3. Copy the **Client ID** and **Client Secret**.
4. Either:
   - Set `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` / `DISCORD_REDIRECT_URI` as instance-wide
     defaults, or
   - Sign in as a workspace Owner/Admin → **Admin → Authentication**, enable Discord, and paste
     the credentials there (per-workspace credentials take priority for that workspace).

The client secret is only ever read/used server-side and is never sent to the browser.

## Cloudinary setup

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From the dashboard, copy your **Cloud name**, **API Key**, and **API Secret**.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in your `.env`
   (or your host's environment variables).

Uploads use short-lived signed requests generated server-side (`/api/uploads/signature`), so
your API secret never reaches the browser. The Cloudinary integration is isolated behind
`lib/uploads/provider.ts` — swap in a different provider by implementing that interface.

## Deploying to Cloudflare (Workers/Pages + D1)

Breakroom deploys to Cloudflare via [OpenNext](https://opennext.js.org/cloudflare).

1. Install Wrangler and log in: `npx wrangler login`.
2. Create a D1 database: `npx wrangler d1 create breakroom`. Copy the returned
   `database_id` into `wrangler.toml`.
3. Apply migrations to the remote D1 database:
   ```bash
   npx wrangler d1 migrations apply breakroom --remote
   ```
4. Set secrets (never commit these):
   ```bash
   npx wrangler secret put SESSION_SECRET
   npx wrangler secret put CLOUDINARY_API_SECRET
   npx wrangler secret put DISCORD_CLIENT_SECRET
   # ...and any other secret values from .env.example
   ```
   Non-secret vars (like `APP_URL`, `CLOUDINARY_CLOUD_NAME`) can go in `wrangler.toml` under
   `[vars]`.
5. Build and deploy:
   ```bash
   npm run cf:build
   npm run cf:deploy
   ```
6. Set `APP_URL` to your `*.pages.dev` domain (or custom domain) and update your Discord
   redirect URI to match.

`getDb()` (`src/lib/db/index.ts`) automatically uses the D1 binding (`env.DB`) when running on
Cloudflare, and libSQL everywhere else — no code changes needed between environments.

## Deploying to Vercel

1. Push your fork to GitHub and [import it into Vercel](https://vercel.com/new).
2. Provision a database Vercel's serverless functions can reach across invocations —
   [Turso](https://turso.tech) (libSQL) is the natural fit since it's the same driver used
   locally:
   ```bash
   turso db create breakroom
   turso db show breakroom --url          # → DATABASE_URL
   turso db tokens create breakroom       # → DATABASE_AUTH_TOKEN
   ```
3. In Vercel's project settings, add all variables from `.env.example` (`APP_URL` = your
   Vercel domain, `DATABASE_URL` / `DATABASE_AUTH_TOKEN` from Turso, plus Cloudinary/Discord
   credentials).
4. Apply migrations against the Turso database before (or right after) your first deploy:
   ```bash
   DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:migrate
   ```
5. Deploy. Vercel builds with `next build` automatically; no extra configuration needed.

## Workspace subdomains (optional)

Breakroom can serve each workspace on its own subdomain (`acme.yourdomain.com`) instead of a
path prefix (`yourdomain.com/acme`) — both work at the same time, no separate deploy needed.

1. Point a wildcard DNS record at your deployment: `*.yourdomain.com` → your host (an `A`/`ALIAS`
   record on Vercel, or a wildcard entry on whatever's in front of your server elsewhere).
2. Set `APP_URL=https://yourdomain.com` (the root domain) — `src/middleware.ts` uses it to
   recognize which incoming hosts are workspace subdomains.
3. Optionally set `COOKIE_DOMAIN=.yourdomain.com` so signing in on one workspace subdomain keeps
   you signed in on others too. Leave it unset and cookies stay host-only (fine for a single
   workspace, or for purely path-based use).

Visiting `acme.yourdomain.com` transparently rewrites to the same `/acme/...` routes used by
path-based URLs — nothing about the app's routes or links needs to change.

## Other Node hosting (self-hosted server, Docker, etc.)

Breakroom is a standard Next.js app — `npm run build && npm run start` works anywhere Node 20+
runs. Point `DATABASE_URL` at a local SQLite file (simplest, single-instance) or a Turso
database (if you want a managed, replicated store), run `npm run db:migrate`, and put it
behind a reverse proxy (Caddy, nginx) for TLS.

## Roadmap

- Additional OAuth providers (Google, Microsoft, GitHub) using the existing provider
  abstraction (`lib/auth/providers/`).
- Drag-and-drop shift rearranging.
- Email delivery for invites/password resets (currently logged to the console by default —
  see `lib/email.ts` to plug in a real provider).

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, project
structure, and PR guidelines.

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities and a summary of the
security practices baked into the app.

## License

[MIT](LICENSE) — use it, fork it, self-host it, build a business on it. Attribution
appreciated but not required.
