import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { Province } from '@/types/org';

export type CreateProvinceInput = {
  name: string;
  code: string;
  country?: string;
};

/** POST /v1/org/provinces/ — création d'une province (super_admin). */
export const useCreateProvince = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProvinceInput) =>
      api.post<Province>('/v1/org/provinces/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'provinces'] });
      onSuccess?.();
    },
  });
};
