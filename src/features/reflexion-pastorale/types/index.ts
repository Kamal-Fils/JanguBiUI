import { z } from 'zod';

export const pastoralReflectionSchema = z.object({
  id: z.number(),
  content: z.string(),
  author_name: z.string().optional().nullable(),
  author_role: z.string().optional().nullable(),
  date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PastoralReflection = z.infer<typeof pastoralReflectionSchema>;
