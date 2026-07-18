import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { Parish } from '@/types/org';

export type CreateParishInput = {
  name: string;
  diocese_id: number;
  city?: string;
  address?: string;
};

/** POST /v1/org/parishes/ — création d'une paroisse (super_admin). */
export const useCreateParish = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateParishInput) =>
      api.post<Parish>('/v1/org/parishes/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'parishes'] });
      onSuccess?.();
    },
  });
};
