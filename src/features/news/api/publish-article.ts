import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Article, articleSchema } from '../types';

export const publishArticle = (articleId: string): Promise<Article> =>
  api
    .post<unknown>(`/v1/news/admin/${articleId}/publish/`, {})
    .then((res) => articleSchema.parse(res));

export const usePublishArticle = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (articleId: string) => publishArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      onSuccess?.();
    },
  });
};
