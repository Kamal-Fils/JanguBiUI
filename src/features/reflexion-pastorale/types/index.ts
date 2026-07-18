import { z } from 'zod';

// Aligné sur ReflectionOutputSerializer (apps/spiritual) : `id` est un UUID
// (string) et la date du jour est portée par `reflection_date`. Un `id: number`
// ferait échouer le parse Zod sur chaque réponse réelle et éteindrait
// silencieusement toute la feature (widget vide, composer bloqué).
export const pastoralReflectionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string(),
  author_name: z.string().nullable().optional(),
  reflection_date: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PastoralReflection = z.infer<typeof pastoralReflectionSchema>;
