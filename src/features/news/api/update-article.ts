import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { Article, articleSchema } from '../types';

/** Corps dérivé du contrat OpenAPI — voir la note de `create-article.ts`. */
export type UpdateArticleInput = Partial<
  RequestBody<'v1_news_admin_update_partial_update'>
>;

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
        queryKey: ['articles', 'admin', 'detail', article.id],
      });
      onSuccess?.(article);
    },
  });
};
