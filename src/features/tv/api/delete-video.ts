import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export const useDeleteVideo = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: number) =>
      api.delete<void>(`/v1/tv/videos/${videoId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-videos'] });
      onSuccess?.();
    },
  });
};
