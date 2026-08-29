import { z } from "zod";
import { slugSchema } from "@/lib/validation/workspace";

export const kbArticleSchema = z.object({
  title: z.string().min(1, "Give it a title").max(120),
  slug: slugSchema,
  content: z.string().max(50_000, "Keep articles under 50,000 characters"),
  category: z.string().max(60).optional().nullable(),
  status: z.enum(["draft", "published"]).optional(),
});

export const updateKbArticleSchema = kbArticleSchema.partial();

export const kbCommentSchema = z.object({
  content: z.string().min(1, "Comment can't be empty").max(2000),
});

export const kbReactionSchema = z.object({
  emoji: z.string().min(1).max(8),
});
