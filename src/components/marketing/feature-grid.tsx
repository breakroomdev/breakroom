import { Rss, BarChart3, CalendarDays, Users, Palette, Github, ServerCog } from "lucide-react";

const FEATURES = [
  {
    icon: Rss,
    title: "A feed people actually read",
    description: "Text posts, photos, pinned announcements — all in a clean, fast timeline your whole team checks.",
  },
  {
    icon: BarChart3,
    title: "Polls that get answers",
    description: "Ask a question, set an expiry, and watch results roll in live with clear percentage bars.",
  },
  {
    icon: CalendarDays,
    title: "Scheduling without the spreadsheet",
    description: "Day, week and month views. Assign shifts, see coverage, and let everyone know what's next.",
  },
  {
    icon: Users,
    title: "A real team directory",
    description: "Photos, roles, departments and contact info — so new hires know who's who from day one.",
  },
  {
    icon: Palette,
    title: "Themes that fit your brand",
    description: "Seven color themes plus light, dark and system mode. Set a default, let people personalize.",
  },
  {
    icon: ServerCog,
    title: "Self-host in minutes",
    description: "Deploy to Cloudflare or Vercel with one command, or run it on your own server.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
          Everything in one place
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">Built for the way teams actually work</h2>
        <p className="mt-3 text-muted-foreground">No more scattered group chats, spreadsheets and paper schedules.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary transition-transform group-hover:scale-110">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function OpenSourceSection() {
  return (
    <section id="open-source" className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid items-center gap-10 rounded-3xl border border-border bg-gradient-brand-soft p-10 lg:grid-cols-2 lg:p-16">
        <div>
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
            <Github className="h-3.5 w-3.5" /> Free & open source
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-balance">Yours to run, fork and extend</h2>
          <p className="mt-3 text-muted-foreground">
            Breakroom is MIT-licensed and built to be self-hosted. Deploy it on Cloudflare Workers, Vercel, or your own
            server — no proprietary backend required, no per-seat pricing, no lock-in.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            {["Clone the repo and run it locally in minutes", "Deploy to Cloudflare or Vercel with one command", "Bring your own Cloudinary and Discord app credentials"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 font-mono text-sm shadow-card">
          <div className="mb-3 flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          </div>
          <p className="text-muted-foreground">
            <span className="text-primary">$</span> git clone github.com/breakroomdev/breakroom
          </p>
          <p className="text-muted-foreground">
            <span className="text-primary">$</span> cd breakroom &amp;&amp; npm install
          </p>
          <p className="text-muted-foreground">
            <span className="text-primary">$</span> cp .env.example .env
          </p>
          <p className="text-muted-foreground">
            <span className="text-primary">$</span> npm run db:migrate &amp;&amp; npm run db:seed
          </p>
          <p>
            <span className="text-primary">$</span> npm run dev
          </p>
        </div>
      </div>
    </section>
  );
}
