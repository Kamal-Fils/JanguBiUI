import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export const deleteArticle = (articleId: string): Promise<void> =>
  api.delete<void>(`/v1/news/admin/${articleId}/delete/`);

export const useDeleteArticle = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (articleId: string) => deleteArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', 'admin'] });
      onSuccess?.();
    },
  });
};
