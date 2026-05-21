import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

interface SubmitIntentionInput {
  intention_type: string;
  intention_text: string;
  parish_id?: number | null;
}

export const useSubmitIntention = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitIntentionInput) =>
      api.post<void>('/v1/mass-intentions/submit/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-intentions-my'] });
      onSuccess?.();
    },
  });
};
