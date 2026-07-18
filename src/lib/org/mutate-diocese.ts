import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { Diocese } from '@/types/org';

export type UpdateDioceseInput = {
  id: number;
  name?: string;
  code?: string;
};

/** PATCH /v1/org/dioceses/:id/ — édition d'un diocèse (super_admin). */
export const useUpdateDiocese = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateDioceseInput) =>
      api.patch<Diocese>(`/v1/org/dioceses/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'dioceses'] });
      // Le nom du diocèse est dénormalisé (`diocese_name`) sur les paroisses.
      queryClient.invalidateQueries({ queryKey: ['org', 'parishes'] });
      onSuccess?.();
    },
  });
};

/**
 * DELETE /v1/org/dioceses/:id/ — suppression (super_admin, refusée si des
 * paroisses, doyennés ou communautés y sont rattachés).
 */
export const useDeleteDiocese = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/v1/org/dioceses/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'dioceses'] });
      onSuccess?.();
    },
  });
};
