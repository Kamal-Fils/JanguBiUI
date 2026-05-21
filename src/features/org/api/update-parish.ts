import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export const useSelectParish = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (parishId: number) =>
      api.patch<unknown>('/v1/users/me/update/', { primary_parish: parishId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      onSuccess?.();
    },
  });
};
