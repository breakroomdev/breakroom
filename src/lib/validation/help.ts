import { z } from "zod";
import { slugSchema } from "@/lib/validation/workspace";

export const helpArticleSchema = z.object({
  title: z.string().min(1, "Give it a title").max(120),
  slug: slugSchema,
  content: z.string().max(50_000, "Keep articles under 50,000 characters"),
  category: z.string().max(60).optional().nullable(),
  status: z.enum(["draft", "published"]).optional(),
});

export const updateHelpArticleSchema = helpArticleSchema.partial();
