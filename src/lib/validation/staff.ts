import { z } from "zod";
import { slugSchema } from "@/lib/validation/workspace";

export const updateWorkspaceAsStaffSchema = z.object({
  verified: z.boolean().optional(),
  slug: slugSchema.optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Give it a title").max(120),
  body: z.string().max(2000).optional(),
  link: z.string().url("Enter a valid URL, including https://").optional().or(z.literal("")),
});
