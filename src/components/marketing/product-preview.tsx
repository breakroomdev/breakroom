import { Home, Rss, CalendarDays, BarChart3, Users, Bell, Heart, MessageCircle } from "lucide-react";

export function ProductPreview() {
  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="absolute -inset-x-10 -inset-y-10 -z-10 bg-gradient-brand opacity-[0.15] blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-popover">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-3 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">breakroom.app/acme</span>
        </div>
        <div className="flex">
          <div className="hidden w-48 shrink-0 space-y-1 border-r border-border p-3 sm:block">
            <div className="mb-3 flex items-center gap-2 px-2 py-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand text-xs font-bold text-white">A</span>
              <span className="font-display text-sm font-semibold">Acme Inc.</span>
            </div>
            {[
              { icon: Home, label: "Home" },
              { icon: Rss, label: "Feed", active: true },
              { icon: CalendarDays, label: "Schedule" },
              { icon: BarChart3, label: "Polls" },
              { icon: Users, label: "Team" },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm ${item.active ? "bg-primary-50 font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-300" : "text-muted-foreground"}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            ))}
          </div>

          <div className="flex-1 space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-semibold">Feed</p>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="rounded-xl border border-border bg-gradient-brand-soft p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-gradient-brand" />
                <div>
                  <p className="text-xs font-semibold">Priya Sharma</p>
                  <p className="text-[10px] text-muted-foreground">Store Manager · Pinned</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed">
                🎉 Huge shoutout to the weekend crew — we hit our best Saturday numbers this quarter! Drinks on the house
                Friday.
              </p>
              <div className="mt-2 flex gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" /> 24
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> 8
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border p-3">
              <p className="mb-2 text-xs font-semibold">📊 Which snacks should we restock?</p>
              <div className="space-y-1.5">
                <div className="relative h-6 overflow-hidden rounded-md bg-muted">
                  <div className="absolute inset-y-0 left-0 w-[68%] rounded-md bg-primary-300" />
                  <span className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-medium">
                    <span>Pretzels</span>
                    <span>68%</span>
                  </span>
                </div>
                <div className="relative h-6 overflow-hidden rounded-md bg-muted">
                  <div className="absolute inset-y-0 left-0 w-[32%] rounded-md bg-primary-300" />
                  <span className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-medium">
                    <span>Trail mix</span>
                    <span>32%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden w-56 shrink-0 space-y-3 border-l border-border p-3 lg:block">
            <p className="text-xs font-semibold text-muted-foreground">Upcoming shifts</p>
            {[
              { name: "Mon · 9:00 AM", role: "Front desk", color: "bg-blue-400" },
              { name: "Wed · 1:00 PM", role: "Warehouse", color: "bg-emerald-400" },
            ].map((shift) => (
              <div key={shift.name} className="flex items-center gap-2 rounded-lg border border-border p-2">
                <span className={`h-8 w-1.5 rounded-full ${shift.color}`} />
                <div>
                  <p className="text-[11px] font-medium">{shift.name}</p>
                  <p className="text-[10px] text-muted-foreground">{shift.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
