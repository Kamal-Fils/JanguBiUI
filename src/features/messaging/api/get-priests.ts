import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const priestSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  full_name: z.string(),
  email: z.string(),
  accepts_pastoral_chat: z.boolean(),
  bio: z.string().nullable().optional(),
});

export type Priest = z.infer<typeof priestSchema>;

const priestListSchema = z.array(priestSchema);

export const getPriests = (): Promise<Priest[]> =>
  api
    .get<unknown>('/v1/messaging/priests/')
    .then((data) => priestListSchema.parse(data));

export const getPriestsQueryOptions = () =>
  queryOptions({
    queryKey: ['priests'],
    queryFn: getPriests,
  });

export const usePriests = () => useQuery(getPriestsQueryOptions());
