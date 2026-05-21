import { z } from 'zod';

export const articleCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

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
  scope_type: z.enum(['global', 'diocese', 'parish']),
  scope_type_label: z.string().optional(),
  scope_parish_id: z.number().nullable().optional(),
  scope_diocese_id: z.number().nullable().optional(),
  status: z.enum(['draft', 'published', 'unpublished']),
  status_label: z.string().optional(),
  views_count: z.number(),
  published_at: z.string().nullable().optional(),
  created_at: z.string(),
});

export const articleDetailSchema = articleSchema.extend({
  content: z.string(),
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
