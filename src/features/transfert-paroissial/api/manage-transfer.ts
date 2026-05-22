import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

const invalidateTransfers = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['transfers'] });
};

export const useApproveTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transferId: number) =>
      api.post<void>(`/v1/transfers/${transferId}/approve/`, {}),
    onSuccess: () => invalidateTransfers(queryClient),
  });
};

export const useRejectTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transferId, reason }: { transferId: number; reason: string }) =>
      api.post<void>(`/v1/transfers/${transferId}/reject/`, { reason }),
    onSuccess: () => invalidateTransfers(queryClient),
  });
};

export const useAcknowledgeTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transferId: number) =>
      api.post<void>(`/v1/transfers/${transferId}/acknowledge/`, {}),
    onSuccess: () => invalidateTransfers(queryClient),
  });
};
