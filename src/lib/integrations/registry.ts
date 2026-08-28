import type { LucideIcon } from "lucide-react";
import { Gamepad2, MessageSquare, Users, Sparkles, Webhook } from "lucide-react";

/**
 * The catalog of integration types Breakroom knows about. Adding a new
 * integration means adding an entry here (+ its own config/view components) —
 * everything else (the admin list, enable/disable, secrets, health,
 * connect/disconnect) is handled generically by the integrations system.
 */
export interface IntegrationTypeDef {
  type: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** "available" types can be connected today; "coming_soon" ones are shown greyed out for the roadmap. */
  status: "available" | "coming_soon";
}

export const INTEGRATION_TYPES: IntegrationTypeDef[] = [
  {
    type: "roblox_chat",
    name: "Roblox Chat Logger",
    description: "Connect your Roblox experience to Breakroom and display in-game chat messages directly in your workspace.",
    icon: Gamepad2,
    status: "available",
  },
  {
    type: "discord",
    name: "Discord",
    description: "Mirror channel messages between Discord and Breakroom.",
    icon: MessageSquare,
    status: "coming_soon",
  },
  {
    type: "roblox_group",
    name: "Roblox Group",
    description: "Sync your Roblox group's roster and ranks with workspace roles.",
    icon: Users,
    status: "coming_soon",
  },
  {
    type: "google",
    name: "Google",
    description: "Sign in with Google and sync your team's calendar.",
    icon: Sparkles,
    status: "coming_soon",
  },
  {
    type: "webhook",
    name: "Custom Webhooks",
    description: "Send Breakroom events to any URL you control.",
    icon: Webhook,
    status: "coming_soon",
  },
];

export function getIntegrationType(type: string): IntegrationTypeDef | undefined {
  return INTEGRATION_TYPES.find((t) => t.type === type);
}
