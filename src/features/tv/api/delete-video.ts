import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import type { TvVideosResponse } from './get-videos';

type DeleteContext = {
  previous: [readonly unknown[], TvVideosResponse | undefined][];
};

export const useDeleteVideo = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number, DeleteContext>({
    mutationFn: (videoId: number) =>
      api.delete<void>(`/v1/tv/videos/${videoId}/`),
    // Update optimiste : retire la vidéo de toutes les pages en cache.
    onMutate: async (videoId) => {
      await queryClient.cancelQueries({ queryKey: ['tv-videos'] });
      const previous = queryClient.getQueriesData<TvVideosResponse>({
        queryKey: ['tv-videos'],
      });
      previous.forEach(([key, data]) => {
        if (!data) return;
        const hadVideo = data.results.some((v) => v.id === videoId);
        queryClient.setQueryData<TvVideosResponse>(key, {
          ...data,
          count: hadVideo ? Math.max(0, data.count - 1) : data.count,
          results: data.results.filter((v) => v.id !== videoId),
        });
      });
      return { previous };
    },
    onError: (_err, _videoId, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-videos'] });
    },
  });
};
