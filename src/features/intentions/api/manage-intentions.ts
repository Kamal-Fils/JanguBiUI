import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

const invalidate = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['mass-intentions-parish'] });
  queryClient.invalidateQueries({ queryKey: ['mass-intentions-my'] });
};

export const useAcceptIntention = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (intentionId: number) =>
      api.post<void>(`/v1/mass-intentions/${intentionId}/accept/`, {}),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useProposeDate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      intentionId,
      proposed_date,
    }: {
      intentionId: number;
      proposed_date: string;
    }) =>
      api.post<void>(`/v1/mass-intentions/${intentionId}/propose-date/`, {
        proposed_date,
      }),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useCelebrateIntention = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (intentionId: number) =>
      api.post<void>(`/v1/mass-intentions/${intentionId}/celebrate/`, {}),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeclineIntention = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      intentionId,
      notes,
    }: {
      intentionId: number;
      notes?: string;
    }) =>
      api.post<void>(`/v1/mass-intentions/${intentionId}/decline/`, { notes }),
    onSuccess: () => invalidate(queryClient),
  });
};
