import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { Parish } from '@/types/org';

export type UpdateParishInput = {
  id: number;
  name?: string;
  city?: string;
  address?: string;
};

/** PATCH /v1/org/parishes/:id/ — édition d'une paroisse (super_admin). */
export const useUpdateParish = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateParishInput) =>
      api.patch<Parish>(`/v1/org/parishes/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'parishes'] });
      onSuccess?.();
    },
  });
};

/** DELETE /v1/org/parishes/:id/ — suppression (super_admin, refusée si données liées). */
export const useDeleteParish = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/v1/org/parishes/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'parishes'] });
      onSuccess?.();
    },
  });
};
