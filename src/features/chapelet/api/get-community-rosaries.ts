import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const communityRosarySchema = z.object({
  id: z.number(),
  initiator_email: z.string().email().nullable().optional(),
  mystery_group_name: z.string().nullable().optional(),
  intention: z.string(),
  status: z.enum(['active', 'completed', 'cancelled']),
  current_decade: z.number(),
  started_at: z.string(),
});

export type CommunityRosary = z.infer<typeof communityRosarySchema>;

export const getCommunityRosaries = (): Promise<CommunityRosary[]> =>
  api
    .get<unknown>('/v1/rosary/community/')
    .then((res) =>
      (res as unknown[]).map((item) => communityRosarySchema.parse(item)),
    );

export const getCommunityRosariesQueryOptions = () =>
  queryOptions({
    queryKey: ['community-rosaries'],
    queryFn: getCommunityRosaries,
  });

export const useCommunityRosaries = () =>
  useQuery(getCommunityRosariesQueryOptions());
