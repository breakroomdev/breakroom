import { z } from "zod";

export const WORKSPACE_THEMES = ["default", "ocean", "sunset", "forest", "lavender", "berry", "slate"] as const;

export const slugSchema = z
  .string()
  .min(2, "Must be at least 2 characters")
  .max(48, "Must be at most 48 characters")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Only lowercase letters, numbers and hyphens");

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  theme: z.enum(WORKSPACE_THEMES).optional(),
});

export const updateWorkspaceAuthSchema = z.object({
  authPasswordEnabled: z.boolean().optional(),
  authDiscordEnabled: z.boolean().optional(),
  discordClientId: z.string().max(200).optional().nullable(),
  discordClientSecret: z.string().max(200).optional().nullable(),
  discordRedirectUri: z.string().url().optional().nullable(),
  allowSelfRegistration: z.boolean().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  roleId: z.string().min(1),
});

export const updateMemberSchema = z.object({
  roleId: z.string().min(1).optional(),
  status: z.enum(["active", "disabled"]).optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  jobTitle: z.string().max(120).optional().nullable(),
  department: z.string().max(120).optional().nullable(),
  pronouns: z.string().max(40).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  hideEmail: z.boolean().optional(),
  colorMode: z.enum(["light", "dark", "system"]).optional(),
  themeOverride: z.enum(WORKSPACE_THEMES).nullable().optional(),
});
