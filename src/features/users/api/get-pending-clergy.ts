import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const PASTORAL_ROLES = ['pretre', 'diacre', 'religieux', 'eveque', 'archeveque'] as const;

export const pendingClergySchema = z.object({
  id: z.string(),
  email: z.string().email(),
  pastoral_role: z.enum(PASTORAL_ROLES),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  diocese_name: z.string().optional().nullable(),
  parish_name: z.string().optional().nullable(),
  date_joined: z.string().optional().nullable(),
});

export type PendingClergyAccount = z.infer<typeof pendingClergySchema>;

type PendingClergyResponse = { count: number; results: PendingClergyAccount[] };

const parsePendingClergy = (data: unknown): PendingClergyResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => pendingClergySchema.parse(item)),
  };
};

export const getPendingClergy = (): Promise<PendingClergyResponse> =>
  api.get<unknown>('/v1/users/pending-validation/').then(parsePendingClergy);

export const getPendingClergyQueryOptions = (enabled: boolean) =>
  queryOptions({
    queryKey: ['users', 'pending-validation'],
    queryFn: getPendingClergy,
    enabled,
  });

export const usePendingClergy = (enabled = true) =>
  useQuery(getPendingClergyQueryOptions(enabled));
