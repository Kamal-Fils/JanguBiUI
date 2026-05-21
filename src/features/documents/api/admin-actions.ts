import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

const invalidateDocuments = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: ['documents'] });
};

export const useStartVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      api.post<void>(
        `/v1/documents/admin/requests/${requestId}/start-verification/`,
        {},
      ),
    onSuccess: () => invalidateDocuments(queryClient),
  });
};

export const useRequestInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      message,
    }: {
      requestId: string;
      message: string;
    }) =>
      api.post<void>(
        `/v1/documents/admin/requests/${requestId}/request-info/`,
        { message },
      ),
    onSuccess: () => invalidateDocuments(queryClient),
  });
};

export const useValidateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, notes }: { requestId: string; notes?: string }) =>
      api.post<void>(`/v1/documents/admin/requests/${requestId}/validate/`, {
        notes,
      }),
    onSuccess: () => invalidateDocuments(queryClient),
  });
};

export const useRejectDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason: string;
    }) =>
      api.post<void>(`/v1/documents/admin/requests/${requestId}/reject/`, {
        reason,
      }),
    onSuccess: () => invalidateDocuments(queryClient),
  });
};

export const useDepositDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, notes }: { requestId: string; notes?: string }) =>
      api.post<void>(`/v1/documents/admin/requests/${requestId}/deposit/`, {
        notes,
      }),
    onSuccess: () => invalidateDocuments(queryClient),
  });
};
