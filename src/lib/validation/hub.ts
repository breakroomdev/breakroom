import { z } from "zod";

export const createHubLinkSchema = z.object({
  title: z.string().min(1, "Give it a name").max(80),
  url: z.string().url("Enter a valid URL, including https://"),
  description: z.string().max(200).optional().nullable(),
  openMode: z.enum(["embed", "new_tab"]).default("new_tab"),
});

export const updateHubLinkSchema = createHubLinkSchema.partial();

export const reorderHubLinksSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});
