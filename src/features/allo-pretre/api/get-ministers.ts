// LOT2-001 (code mort) : `MinisterList` n'existe plus dans api.ts depuis que C6
// a régénéré le schéma sans /v1/availability. Erreur check-types tolérée et
// documentée — voir docs/known-issues.md. À résoudre en réintégrant availability.
import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { components } from '@/types/api';

export type Minister = components['schemas']['MinisterList'];

export const getMinisters = async (): Promise<Minister[]> => {
  const res = await api.get<{ results: Minister[] } | Minister[]>(
    '/v1/availability/ministers/',
  );
  return Array.isArray(res) ? res : res.results;
};

export const getMinistersQueryOptions = () =>
  queryOptions({ queryKey: ['ministers'], queryFn: getMinisters });

export const useMinisters = () => useQuery(getMinistersQueryOptions());
