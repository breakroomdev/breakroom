import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { COLOR_MODE_COOKIE, type ColorMode } from "@/lib/theme";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "Breakroom — Your workplace, in one place.", template: "%s · Breakroom" },
  description:
    "Breakroom brings workplace communication, schedules, polls and team updates together in one simple, open-source platform.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Breakroom — Your workplace, in one place.",
    description: "The open-source, self-hostable home for workplace communication.",
    siteName: "Breakroom",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#12161f" },
  ],
};

const NO_FLASH_SCRIPT = `
(function () {
  try {
    var mode = document.documentElement.getAttribute('data-color-mode');
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    function apply() {
      var isDark = mode === 'dark' || (mode === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', isDark);
    }
    apply();
    if (mode === 'system') mq.addEventListener('change', apply);
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const cookieMode = cookies().get(COLOR_MODE_COOKIE)?.value as ColorMode | undefined;
  const colorMode: ColorMode = user?.colorMode ?? cookieMode ?? "system";
  const initialDarkClass = colorMode === "dark" ? "dark" : "";

  return (
    <html lang="en" data-color-mode={colorMode} className={cn(inter.variable, jakarta.variable, initialDarkClass)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans">
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
