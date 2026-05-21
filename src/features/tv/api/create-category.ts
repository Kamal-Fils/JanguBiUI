import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

interface CreateCategoryInput {
  name: string;
  order?: number;
  is_clergy_only?: boolean;
}

export const useCreateCategory = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryInput) =>
      api.post<void>('/v1/tv/categories/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-categories'] });
      onSuccess?.();
    },
  });
};
