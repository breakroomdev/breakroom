import { THEME_META, WORKSPACE_THEMES } from "@/lib/theme";

export function ThemeShowcase() {
  return (
    <section id="themes" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
          Make it yours
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">Seven themes, light or dark</h2>
        <p className="mt-3 text-muted-foreground">Pick a workspace default. Everyone can still switch it up for themselves.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {WORKSPACE_THEMES.map((t) => (
          <div key={t} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-card transition-transform hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: `linear-gradient(135deg, ${THEME_META[t].swatch}, ${THEME_META[t].accentSwatch})` }} />
            <p className="text-center text-xs font-medium">{THEME_META[t].label.replace("Breakroom ", "")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
