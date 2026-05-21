import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { clergicalInvitationSchema, ClergicalInvitation } from '../types';

export const getInvitationByToken = (
  token: string,
): Promise<ClergicalInvitation> =>
  api
    .get<unknown>('/v1/clergy-accounts/invitations/validate/', {
      params: { token },
    })
    .then((res) => clergicalInvitationSchema.parse(res));

export const getInvitationByTokenQueryOptions = (token: string) =>
  queryOptions({
    queryKey: ['clergy-invitation-token', token],
    queryFn: () => getInvitationByToken(token),
    retry: false,
  });

export const useInvitationByToken = (token: string) =>
  useQuery({
    ...getInvitationByTokenQueryOptions(token),
    enabled: !!token,
  });
