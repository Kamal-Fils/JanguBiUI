import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export type SubmitSupplementInput = { additional_info: string };

export const useSubmitSupplement = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitSupplementInput) =>
      api.post<unknown>(`/v1/documents/requests/${id}/supplement/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-request', id] });
      queryClient.invalidateQueries({ queryKey: ['document-requests'] });
    },
  });
};
