import { z } from 'zod';

export const tvCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  order: z.number(),
  is_clergy_only: z.boolean().optional().default(false),
});

export const tvVideoSchema = z.object({
  id: z.number(),
  title: z.string(),
  youtube_url: z.string(),
  category: z.object({ id: z.number(), name: z.string(), slug: z.string() }),
  is_live: z.boolean(),
  is_pinned_live: z.boolean(),
  embed_url: z.string(),
});

export type TvCategory = z.infer<typeof tvCategorySchema>;
export type TvVideo = z.infer<typeof tvVideoSchema>;
