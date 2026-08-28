"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Monitor, Moon, Sun, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WORKSPACE_THEMES, THEME_META, COLOR_MODES, type ColorMode, type WorkspaceTheme } from "@/lib/theme";

const MODE_ICONS: Record<ColorMode, React.ComponentType<{ className?: string }>> = { light: Sun, dark: Moon, system: Monitor };

export function AppearanceForm({ colorMode, themeOverride, workspaceTheme }: { colorMode: ColorMode; themeOverride: string | null; workspaceTheme: string }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<ColorMode>(colorMode);
  const [theme, setTheme] = React.useState<WorkspaceTheme | "workspace">((themeOverride as WorkspaceTheme) || "workspace");

  async function save(next: { colorMode?: ColorMode; themeOverride?: WorkspaceTheme | null }) {
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!res.ok) {
      toast.error("Couldn't save your preference.");
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
          <Palette className="h-4 w-4" />
        </div>
        <div>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Personalize how Breakroom looks for you.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium">Color mode</p>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_MODES.map((m) => {
              const Icon = MODE_ICONS[m];
              return (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    save({ colorMode: m });
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium capitalize transition-colors",
                    mode === m ? "border-primary bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300" : "border-border hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Theme</p>
          <p className="mb-3 text-xs text-muted-foreground">Uses your workspace's default ({THEME_META[workspaceTheme as WorkspaceTheme]?.label ?? "Breakroom Default"}) unless you pick your own below.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              onClick={() => {
                setTheme("workspace");
                save({ themeOverride: null });
              }}
              className={cn("flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors", theme === "workspace" ? "border-primary" : "border-border hover:bg-muted")}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-muted-foreground text-[10px]">W</span>
              Workspace default
              {theme === "workspace" ? <Check className="ml-auto h-3.5 w-3.5 text-primary" /> : null}
            </button>
            {WORKSPACE_THEMES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  save({ themeOverride: t });
                }}
                className={cn("flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors", theme === t ? "border-primary" : "border-border hover:bg-muted")}
              >
                <span className="h-5 w-5 rounded-full" style={{ backgroundColor: THEME_META[t].swatch }} />
                {THEME_META[t].label.replace("Breakroom ", "")}
                {theme === t ? <Check className="ml-auto h-3.5 w-3.5 text-primary" /> : null}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
