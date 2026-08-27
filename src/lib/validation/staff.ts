import { z } from "zod";

export const setWorkspaceVerifiedSchema = z.object({
  verified: z.boolean(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Give it a title").max(120),
  body: z.string().max(2000).optional(),
  link: z.string().url("Enter a valid URL, including https://").optional().or(z.literal("")),
});
