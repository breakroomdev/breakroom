import type { LucideIcon } from "lucide-react";
import { Home, Rss, CalendarDays, BarChart3, Image, Users, Bell, Settings, ShieldCheck, LayoutGrid, Plug, BookOpen } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "", icon: Home },
  { label: "Feed", href: "/feed", icon: Rss },
  { label: "Schedule", href: "/schedule", icon: CalendarDays },
  { label: "Polls", href: "/polls", icon: BarChart3 },
  { label: "Media", href: "/media", icon: Image },
  { label: "Team", href: "/team", icon: Users },
  { label: "Hub", href: "/hub", icon: LayoutGrid },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Knowledge Base", href: "/kb", icon: BookOpen },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [{ label: "Admin", href: "/admin", icon: ShieldCheck }];
