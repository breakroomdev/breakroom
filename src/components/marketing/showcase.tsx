import Image from "next/image";
import { MessageCircle, ThumbsUp, PartyPopper } from "lucide-react";

function BrowserFrame({
  src,
  alt,
  priority,
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-border bg-card shadow-popover ${className ?? ""}`}>
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
      </div>
      <div className="relative aspect-[16/10] w-full bg-white">
        <Image src={src} alt={alt} fill priority={priority} sizes="(min-width: 1024px) 640px, 100vw" className="object-cover object-top" />
      </div>
    </div>
  );
}

export function HeroShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <BrowserFrame src="/marketing/home.png" alt="Breakroom home dashboard with pinned posts, upcoming shifts and quick links" priority className="rotate-[0.6deg] shadow-2xl" />

      <div className="absolute -left-6 top-16 hidden rotate-[-4deg] items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-popover sm:flex">
        <PartyPopper className="h-3.5 w-3.5 text-warning" />
        Best Saturday this quarter!
      </div>
      <div className="absolute -right-5 bottom-24 hidden rotate-[3deg] items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-popover sm:flex">
        <ThumbsUp className="h-3.5 w-3.5 text-primary" /> 4
        <MessageCircle className="ml-1 h-3.5 w-3.5 text-accent" /> 2
      </div>
    </div>
  );
}

const SHOWCASE_ITEMS = [
  { src: "/marketing/feed.png", alt: "Breakroom feed showing an announcement and a live poll", label: "Feed", description: "Posts, photos and polls in one scroll." },
  { src: "/marketing/schedule.png", alt: "Breakroom monthly schedule with color-coded shifts", label: "Schedule", description: "Coverage at a glance, color-coded by person." },
  { src: "/marketing/team.png", alt: "Breakroom team directory grid", label: "Team", description: "Every teammate, one searchable directory." },
  { src: "/marketing/polls.png", alt: "Breakroom poll with live percentage results", label: "Polls", description: "Quick answers, live results." },
];

export function ShowcaseSection() {
  return (
    <section id="showcase" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
          See it in action
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">This is the actual app</h2>
        <p className="mt-3 text-muted-foreground">No mockups — every screen below is Breakroom, running with a real team.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {SHOWCASE_ITEMS.map((item) => (
          <div key={item.label} className="w-full min-w-0">
            <BrowserFrame src={item.src} alt={item.alt} className="transition-transform hover:-translate-y-1" />
            <div className="mt-3 px-1">
              <p className="font-display text-sm font-semibold">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
