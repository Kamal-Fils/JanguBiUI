import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { clergicalInvitationSchema } from '../types';

export type InvitationsParams = {
  limit?: number;
  offset?: number;
  status?: string;
};

export type InvitationsResponse = {
  count: number;
  results: z.infer<typeof clergicalInvitationSchema>[];
};

const parseInvitations = (data: unknown): InvitationsResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => clergicalInvitationSchema.parse(item)),
  };
};

export const getInvitations = (
  params?: InvitationsParams,
): Promise<InvitationsResponse> =>
  api
    .get<unknown>('/v1/clergy-accounts/invitations/', { params })
    .then(parseInvitations);

export const getInvitationsQueryOptions = (params?: InvitationsParams) =>
  queryOptions({
    queryKey: ['clergy-invitations', params],
    queryFn: () => getInvitations(params),
  });

export const useInvitations = (params?: InvitationsParams) =>
  useQuery(getInvitationsQueryOptions(params));
