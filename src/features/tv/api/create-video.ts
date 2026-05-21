import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

interface CreateVideoInput {
  title?: string;
  youtube_url: string;
  category_slug: string;
  is_live?: boolean;
  is_pinned_live?: boolean;
}

export const useCreateVideo = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVideoInput) =>
      api.post<void>('/v1/tv/videos/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-videos'] });
      onSuccess?.();
    },
  });
};
