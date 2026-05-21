import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { clergicalInvitationSchema, ClergicalInvitation } from '../types';

export const useAcceptInvitation = ({
  onSuccess,
}: { onSuccess?: (invitation: ClergicalInvitation) => void } = {}) =>
  useMutation({
    mutationFn: (token: string) =>
      api
        .post<unknown>('/v1/clergy-accounts/invitations/accept/', { token })
        .then((res) => clergicalInvitationSchema.parse(res)),
    onSuccess,
  });
