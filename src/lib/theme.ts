export const WORKSPACE_THEMES = ["default", "ocean", "sunset", "forest", "lavender", "berry", "slate"] as const;
export type WorkspaceTheme = (typeof WORKSPACE_THEMES)[number];

export const THEME_META: Record<WorkspaceTheme, { label: string; swatch: string; accentSwatch: string }> = {
  default: { label: "Breakroom Default", swatch: "hsl(166 72% 41%)", accentSwatch: "hsl(28 92% 58%)" },
  ocean: { label: "Ocean", swatch: "hsl(202 89% 46%)", accentSwatch: "hsl(187 72% 45%)" },
  sunset: { label: "Sunset", swatch: "hsl(13 86% 54%)", accentSwatch: "hsl(340 82% 58%)" },
  forest: { label: "Forest", swatch: "hsl(143 55% 36%)", accentSwatch: "hsl(84 55% 42%)" },
  lavender: { label: "Lavender", swatch: "hsl(258 55% 59%)", accentSwatch: "hsl(280 60% 66%)" },
  berry: { label: "Berry", swatch: "hsl(333 62% 49%)", accentSwatch: "hsl(350 75% 60%)" },
  slate: { label: "Slate", swatch: "hsl(215 25% 38%)", accentSwatch: "hsl(199 60% 45%)" },
};

export const COLOR_MODES = ["light", "dark", "system"] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

export const COLOR_MODE_COOKIE = "bx_color_mode";
