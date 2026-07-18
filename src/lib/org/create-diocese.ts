import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { Diocese } from '@/types/org';

export type CreateDioceseInput = {
  name: string;
  code: string;
  province_id: number;
};

/** POST /v1/org/dioceses/ — création d'un diocèse (super_admin). */
export const useCreateDiocese = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDioceseInput) =>
      api.post<Diocese>('/v1/org/dioceses/', data),
    onSuccess: () => {
      // Préfixe ['org', 'dioceses'] → invalide toutes les variantes filtrées
      // (['org', 'dioceses', provinceId]) d'un coup.
      queryClient.invalidateQueries({ queryKey: ['org', 'dioceses'] });
      onSuccess?.();
    },
  });
};
