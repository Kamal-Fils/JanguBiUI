import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Article, articleSchema } from '../types';

export type UpdateArticleInput = {
  title?: string;
  excerpt?: string;
  content?: string;
  category_id?: number;
  cover_image_id?: number | null;
  content_type?: 'announcement' | 'article' | 'pastoral_letter';
  scope_type?: 'global' | 'diocese' | 'parish';
  scope_parish_id?: number | null;
  scope_diocese_id?: number | null;
};

export const updateArticle = (
  articleId: string,
  data: UpdateArticleInput,
): Promise<Article> =>
  api
    .patch<unknown>(`/v1/news/admin/${articleId}/update/`, data)
    .then((res) => articleSchema.parse(res));

export const useUpdateArticle = ({
  onSuccess,
}: { onSuccess?: (article: Article) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticleInput }) =>
      updateArticle(id, data),
    onSuccess: (article) => {
      queryClient.invalidateQueries({ queryKey: ['articles', 'admin'] });
      queryClient.invalidateQueries({
        queryKey: ['articles', 'detail', article.id],
      });
      onSuccess?.(article);
    },
  });
};
