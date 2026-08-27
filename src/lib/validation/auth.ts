import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username must be at most 32 characters")
  .regex(/^[a-z0-9_.]+$/i, "Only letters, numbers, dots and underscores");

export const registerSchema = z.object({
  email: z.string().email("Enter a valid email"),
  username: usernameSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  displayName: z.string().min(1, "Enter your name").max(80),
  workspaceName: z.string().min(2).max(80).optional(),
  workspaceSlug: z.string().min(2).max(48).optional(),
  joinWorkspaceSlug: z.string().min(2).max(48).optional(),
  invite: z.string().optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your username or email"),
  password: z.string().min(1, "Enter your password"),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});
