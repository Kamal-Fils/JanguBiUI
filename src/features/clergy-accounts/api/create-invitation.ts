import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { clergicalInvitationSchema, InvitablePastoralRole } from '../types';

export type CreateInvitationInput = {
  email: string;
  first_name: string;
  last_name: string;
  pastoral_role: InvitablePastoralRole;
  diocese_id?: number | null;
};

export const useCreateInvitation = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvitationInput) =>
      api
        .post<unknown>('/v1/clergy-accounts/invitations/', data)
        .then((res) => clergicalInvitationSchema.parse(res)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clergy-invitations'] });
      onSuccess?.();
    },
  });
};
