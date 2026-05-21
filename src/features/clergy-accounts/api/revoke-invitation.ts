import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { clergicalInvitationSchema } from '../types';

export const useRevokeInvitation = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: number) =>
      api
        .post<unknown>(
          `/v1/clergy-accounts/invitations/${invitationId}/revoke/`,
          {},
        )
        .then((res) => clergicalInvitationSchema.parse(res)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clergy-invitations'] });
      onSuccess?.();
    },
  });
};
