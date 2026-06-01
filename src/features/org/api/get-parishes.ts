import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { Parish } from '@/types/org';

const parishSchema = z.object({
  id: z.number(),
  name: z.string(),
  city: z.string().optional().default(''),
  address: z.string().optional().default(''),
  // Le back renvoie `diocese` (FK) + `diocese_name`. `diocese_id` reste toléré
  // pour les anciens mocks de tests. Tous optionnels → schéma robuste.
  diocese: z.number().optional(),
  diocese_id: z.number().optional(),
  diocese_name: z.string().optional().default(''),
});

const parishesResponseSchema = z.object({
  results: z.array(parishSchema),
});

export type ParishFilters = {
  dioceseId?: number;
  search?: string;
  city?: string;
};

export const getParishes = (filters: ParishFilters = {}): Promise<Parish[]> => {
  const params = new URLSearchParams();
  if (filters.dioceseId) params.set('diocese', String(filters.dioceseId));
  if (filters.search) params.set('search', filters.search);
  if (filters.city) params.set('city', filters.city);
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
