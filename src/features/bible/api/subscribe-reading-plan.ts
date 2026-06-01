import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export const useSubscribeReadingPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: number) =>
      api.post<void>(`/v1/bible/reading-plans/${planId}/subscribe/`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-plans'] });
    },
  });
};

export const useUnsubscribeReadingPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: number) =>
      api.post<void>(`/v1/bible/reading-plans/${planId}/unsubscribe/`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-plans'] });
    },
  });
};
