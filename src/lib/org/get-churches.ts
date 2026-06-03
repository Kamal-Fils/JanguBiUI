import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { Church } from '@/types/org';

const churchSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_main: z.boolean(),
  city: z.string().optional().default(''),
  is_active: z.boolean().optional().default(true),
  parish: z.number(),
  parish_name: z.string().optional().default(''),
});

const churchesResponseSchema = z.object({
  results: z.array(churchSchema),
});

export type ChurchFilters = {
  parishId?: number;
};

export const getChurches = (filters: ChurchFilters = {}): Promise<Church[]> => {
  const params = new URLSearchParams();
  if (filters.parishId) params.set('parish', String(filters.parishId));
  const query = params.toString();
  return api
    .get<unknown>(`/v1/org/churches/${query ? `?${query}` : ''}`)
    .then((data) => churchesResponseSchema.parse(data).results);
};

export const getChurchesQueryOptions = (filters: ChurchFilters = {}) =>
  queryOptions({
    queryKey: ['org', 'churches', filters],
    queryFn: () => getChurches(filters),
    enabled: filters.parishId != null,
    retry: false,
  });

export const useChurches = (filters: ChurchFilters = {}) =>
  useQuery(getChurchesQueryOptions(filters));
