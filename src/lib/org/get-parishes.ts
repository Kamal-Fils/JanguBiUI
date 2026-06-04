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
  // Enveloppe paginée LimitOffsetPagination du back.
  count: z.number().optional(),
  results: z.array(parishSchema),
});

export type ParishFilters = {
  dioceseId?: number;
  search?: string;
  city?: string;
};

// Le back pagine les paroisses (default_limit côté DRF). Un diocèse comme Dakar
// dépasse une page → on charge TOUTES les pages pour ne pas tronquer le dropdown.
const PARISHES_PAGE_SIZE = 100;

export const getParishes = async (
  filters: ParishFilters = {},
): Promise<Parish[]> => {
  const base = new URLSearchParams();
  if (filters.dioceseId) base.set('diocese', String(filters.dioceseId));
  if (filters.search) base.set('search', filters.search);
  if (filters.city) base.set('city', filters.city);

  const all: Parish[] = [];
  let offset = 0;
  for (;;) {
    const params = new URLSearchParams(base);
    params.set('limit', String(PARISHES_PAGE_SIZE));
    params.set('offset', String(offset));
    const page = parishesResponseSchema.parse(
      await api.get<unknown>(`/v1/org/parishes/?${params.toString()}`),
    );
    all.push(...page.results);
    const total = page.count ?? all.length;
    if (page.results.length === 0 || all.length >= total) break;
    offset += PARISHES_PAGE_SIZE;
  }
  return all;
};

export const getParishesQueryOptions = (filters: ParishFilters = {}) =>
  queryOptions({
    queryKey: ['org', 'parishes', filters],
    queryFn: () => getParishes(filters),
    retry: false,
  });

export const useParishes = (filters: ParishFilters = {}) =>
  useQuery(getParishesQueryOptions(filters));
