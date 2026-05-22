import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

const invalidatePending = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['users', 'pending-validation'] });
  queryClient.invalidateQueries({ queryKey: ['admin-users'] });
};

export const useApproveClergy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<void>(`/v1/users/${userId}/validate-account/`, {}),
    onSuccess: () => invalidatePending(queryClient),
  });
};

export const useRejectClergyAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      api.post<void>(`/v1/users/${userId}/reject-account/`, { reason }),
    onSuccess: () => invalidatePending(queryClient),
  });
};
