# Contributing to Breakroom

Thanks for considering a contribution! Breakroom is free and open source, and
we'd love your help making it better.

## Getting set up

```bash
git clone https://github.com/breakroomdev/breakroom.git
cd breakroom
npm install
cp .env.example .env
npm run db:generate   # generate SQL migrations from the schema (first time only)
npm run db:migrate    # apply them to a local SQLite file
npm run db:seed       # optional: populate demo data
npm run dev
```

See [README.md](README.md) for full environment variable documentation.

## Project structure

```
src/
  app/                 Next.js App Router routes (pages + API routes)
  components/
    ui/                Design system primitives (Button, Card, Dialog, ...)
    feed/ schedule/ ... Feature-specific components
    layout/            App shell, sidebar, nav
  lib/
    db/                Drizzle schema + database client
    auth/              Sessions, password hashing, OAuth providers
    services/          Data-access helpers used by pages and API routes
    validation/        Zod schemas
  types/               Shared TypeScript types
scripts/               DB migration + seed scripts
drizzle/               Generated SQL migrations
```

## Code style

- TypeScript everywhere; avoid `any` where a real type is reasonable.
- Server-side authorization is mandatory for anything sensitive — never rely
  on a hidden button as the only protection for a privileged action.
- Validate all request bodies with a Zod schema (see `lib/validation/`).
- Keep components focused; prefer composing small components over one large
  file.
- Match the existing design tokens (`globals.css` / `tailwind.config.ts`)
  instead of hard-coding colors.
- Run `npm run typecheck` and `npm run lint` before opening a PR.

## Making changes to the database schema

1. Edit `src/lib/db/schema.ts`.
2. Run `npm run db:generate` to create a new migration file in `drizzle/`.
3. Run `npm run db:migrate` to apply it locally, and commit the generated
   migration file alongside your schema change.

## Submitting a pull request

1. Fork the repo and create a branch off `main`.
2. Make your change, with tests or manual verification notes where relevant.
3. Make sure `npm run build` succeeds.
4. Open a PR describing what changed and why. Screenshots are appreciated for
   UI changes.

## Reporting bugs / requesting features

Please open a GitHub issue with as much detail as you can: steps to
reproduce, expected vs. actual behavior, and your environment (self-hosted
Node, Cloudflare, Vercel, browser, etc).

For security vulnerabilities, see [SECURITY.md](SECURITY.md) instead of
opening a public issue.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind.
