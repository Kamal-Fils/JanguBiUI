import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Article, articleSchema } from '../types';

export type UnpublishArticleInput = { reason?: string };

export const unpublishArticle = (
  articleId: string,
  data: UnpublishArticleInput = {},
): Promise<Article> =>
  api
    .post<unknown>(`/v1/news/admin/${articleId}/unpublish/`, data)
    .then((res) => articleSchema.parse(res));

export const useUnpublishArticle = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: UnpublishArticleInput }) =>
      unpublishArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      onSuccess?.();
    },
  });
};
