import { Rss, BarChart3, CalendarDays, Users, Palette, LayoutGrid, UserCheck, Shuffle } from "lucide-react";

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
    icon: LayoutGrid,
    title: "One hub for your tools",
    description: "Curate the links your team uses every day — docs, dashboards, trackers — in one place, opened inline.",
  },
  {
    icon: Palette,
    title: "Themes that fit your brand",
    description: "Seven color themes plus light, dark and system mode. Set a default, let people personalize.",
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

const STEPS = [
  {
    icon: UserCheck,
    title: "Create your workspace",
    description: "Set it up in a couple of minutes — name it, pick a theme, and it's ready.",
  },
  {
    icon: Shuffle,
    title: "Invite your team",
    description: "Send invite links or open self-serve sign-up. Set roles and permissions as you go.",
  },
  {
    icon: Rss,
    title: "Everyone's on the same page",
    description: "Posts, schedules, polls and your team's tools — all in the place people actually check.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
          Get started fast
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">Up and running today</h2>
        <p className="mt-3 text-muted-foreground">No IT ticket, no lengthy rollout — your team can be in Breakroom this afternoon.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <span className="font-display text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
            </div>
            <h3 className="font-display text-base font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
