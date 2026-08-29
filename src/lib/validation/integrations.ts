import { z } from "zod";

const numericIdString = z.string().trim().regex(/^\d+$/, "Must be a numeric ID");

export const connectRobloxIntegrationSchema = z.object({
  name: z.string().min(1, "Give it a name").max(80).default("Roblox Chat Logger"),
  universeId: numericIdString,
  placeId: numericIdString,
});

export const connectApiAppSchema = z.object({
  name: z.string().min(1, "Give it a name").max(80).default("API App"),
  description: z.string().max(300).optional(),
});

export const updateIntegrationSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  enabled: z.boolean().optional(),
  config: z
    .object({
      universeId: numericIdString.optional(),
      placeId: numericIdString.optional(),
    })
    .partial()
    .optional(),
});

export const listRobloxMessagesQuerySchema = z.object({
  cursor: z.coerce.number().int().optional(),
  q: z.string().max(200).optional(),
  username: z.string().max(20).optional(),
  jobId: z.string().max(100).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** The payload the Roblox server script POSTs for every chat message. */
export const robloxChatIngestSchema = z.object({
  universeId: numericIdString,
  placeId: numericIdString,
  jobId: z.string().min(1).max(100),
  userId: z.number().int().positive(),
  username: z.string().min(1).max(30),
  displayName: z.string().min(1).max(60),
  message: z.string().min(1).max(500),
  timestamp: z.string().datetime(),
});
