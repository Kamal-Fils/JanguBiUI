import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { Parish } from '@/types/org';

const parishSchema = z.object({
  id: z.number(),
  name: z.string(),
  city: z.string(),
  address: z.string(),
  diocese_id: z.number(),
});

const parishesResponseSchema = z.object({
  results: z.array(parishSchema),
});

export type ParishFilters = {
  dioceseId?: number;
  search?: string;
};

export const getParishes = (filters: ParishFilters = {}): Promise<Parish[]> => {
  const params = new URLSearchParams();
  if (filters.dioceseId) params.set('diocese', String(filters.dioceseId));
  if (filters.search) params.set('search', filters.search);
  const query = params.toString();
  return api
    .get<unknown>(`/v1/org/parishes/${query ? `?${query}` : ''}`)
    .then((data) => parishesResponseSchema.parse(data).results);
};

export const getParishesQueryOptions = (filters: ParishFilters = {}) =>
  queryOptions({
    queryKey: ['org', 'parishes', filters],
    queryFn: () => getParishes(filters),
    retry: false,
  });

export const useParishes = (filters: ParishFilters = {}) =>
  useQuery(getParishesQueryOptions(filters));
