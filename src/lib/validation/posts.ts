import { z } from "zod";

export const createPostSchema = z
  .object({
    type: z.enum(["text", "image", "announcement", "poll"]),
    content: z.string().max(5000).optional(),
    images: z
      .array(
        z.object({
          url: z.string().url(),
          publicId: z.string().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
        })
      )
      .max(10)
      .optional(),
    commentsEnabled: z.boolean().default(true),
    poll: z
      .object({
        question: z.string().min(1).max(300),
        options: z.array(z.string().min(1).max(120)).min(2).max(10),
        allowMultiple: z.boolean().default(false),
        expiresAt: z.string().datetime().optional().nullable(),
      })
      .optional(),
  })
  .refine((data) => (data.type === "poll" ? !!data.poll : true), {
    message: "Poll details are required for poll posts",
    path: ["poll"],
  })
  .refine((data) => (data.type !== "poll" ? !!data.content?.trim() || !!data.images?.length : true), {
    message: "Post must have text or an image",
    path: ["content"],
  });

export const updatePostSchema = z.object({
  content: z.string().max(5000).optional(),
  isPinned: z.boolean().optional(),
  commentsEnabled: z.boolean().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment can't be empty").max(2000),
});

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(8),
});

export const reportSchema = z.object({
  targetType: z.enum(["post", "comment", "poll"]),
  targetId: z.string().min(1),
  reason: z.string().min(1).max(500),
});
