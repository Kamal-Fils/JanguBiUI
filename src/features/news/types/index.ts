import { z } from 'zod';

export const articleCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

/**
 * Réactions communautaires (SRS) — prier / amen / participer.
 *
 * `counts` est global, `mine` est personnel : la carte doit pouvoir afficher
 * « 12 » ET « vous en faites partie » sans une requête par article. Les deux
 * arrivent donc DANS la charge utile de l'article (liste et détail), annotés
 * côté serveur.
 */
export const REACTION_TYPES = ['pray', 'amen', 'attend'] as const;

export const reactionTypeSchema = z.enum(REACTION_TYPES);

export const articleReactionsSchema = z.object({
  counts: z.object({
    pray: z.number(),
    amen: z.number(),
    attend: z.number(),
  }),
  mine: z.array(reactionTypeSchema),
});

export type ReactionType = z.infer<typeof reactionTypeSchema>;
export type ArticleReactions = z.infer<typeof articleReactionsSchema>;

export const EMPTY_REACTIONS: ArticleReactions = {
  counts: { pray: 0, amen: 0, attend: 0 },
  mine: [],
};

export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  category: articleCategorySchema.nullable().optional(),
  author_name: z.string(),
  content_type: z
    .enum(['announcement', 'article', 'pastoral_letter'])
    .optional(),
  content_type_label: z.string().optional(),
  // Annonces : date du jour concerné (ex. dimanche) — bloc « Annonces du dimanche ».
  announcement_date: z.string().nullable().optional(),
  scope_type: z.enum(['global', 'diocese', 'parish', 'church']),
  scope_type_label: z.string().optional(),
  scope_parish_id: z.number().nullable().optional(),
  scope_diocese_id: z.number().nullable().optional(),
  scope_church_id: z.number().nullable().optional(),
  status: z.enum(['draft', 'published', 'unpublished']),
  status_label: z.string().optional(),
  views_count: z.number(),
  // Optionnel pour rester tolérant aux réponses servies avant le déploiement
  // du bloc `reactions` — l'UI retombe alors sur EMPTY_REACTIONS plutôt que de
  // faire échouer le parse de tout le fil.
  reactions: articleReactionsSchema.optional(),
  published_at: z.string().nullable().optional(),
  created_at: z.string(),
});

export const articleDetailSchema = articleSchema.extend({
  content: z.string(),
  // 'html' = éditeur riche (sanitizé serveur) ; 'text' = ancien contenu brut.
  content_format: z.enum(['text', 'html']).optional(),
  updated_at: z.string().optional(),
  unpublished_at: z.string().nullable().optional(),
  unpublished_by_name: z.string().nullable().optional(),
  unpublish_reason: z.string().nullable().optional(),
});

export type ArticleCategory = z.infer<typeof articleCategorySchema>;
export type Article = z.infer<typeof articleSchema>;
export type ArticleDetail = z.infer<typeof articleDetailSchema>;
export type ContentType = 'announcement' | 'article' | 'pastoral_letter';
export type ArticleStatus = 'draft' | 'published' | 'unpublished';
