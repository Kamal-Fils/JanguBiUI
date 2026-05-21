import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Article, articleSchema, ContentType } from '../types';

export type CreateArticleInput = {
  title: string;
  content: string;
  category_id: number;
  content_type?: ContentType;
  excerpt?: string;
  cover_image_id?: number | null;
  scope_type?: 'global' | 'diocese' | 'parish';
  scope_parish_id?: number | null;
  scope_diocese_id?: number | null;
};

export const createArticle = (data: CreateArticleInput): Promise<Article> =>
  api
    .post<unknown>('/v1/news/admin/create/', data)
    .then((res) => articleSchema.parse(res));

export const useCreateArticle = ({
  onSuccess,
}: { onSuccess?: (article: Article) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createArticle,
    onSuccess: (article) => {
      queryClient.invalidateQueries({ queryKey: ['articles', 'admin'] });
      onSuccess?.(article);
    },
  });
};
