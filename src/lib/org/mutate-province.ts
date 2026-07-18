import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { Province } from '@/types/org';

export type UpdateProvinceInput = {
  id: number;
  name?: string;
  code?: string;
};

/** PATCH /v1/org/provinces/:id/ — édition d'une province (super_admin). */
export const useUpdateProvince = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateProvinceInput) =>
      api.patch<Province>(`/v1/org/provinces/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'provinces'] });
      // Le nom de la province est dénormalisé (`province_name`) sur les diocèses.
      queryClient.invalidateQueries({ queryKey: ['org', 'dioceses'] });
      onSuccess?.();
    },
  });
};

/** DELETE /v1/org/provinces/:id/ — suppression (super_admin, refusée si diocèses liés). */
export const useDeleteProvince = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/v1/org/provinces/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'provinces'] });
      onSuccess?.();
    },
  });
};
