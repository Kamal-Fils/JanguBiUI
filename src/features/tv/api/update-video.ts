import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

interface UpdateVideoInput {
  videoId: number;
  title?: string;
  youtube_url?: string;
  category_slug?: string;
  is_live?: boolean;
  is_pinned_live?: boolean;
}

export const useUpdateVideo = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ videoId, ...data }: UpdateVideoInput) =>
      api.patch<void>(`/v1/tv/videos/${videoId}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-videos'] });
      onSuccess?.();
    },
  });
};
