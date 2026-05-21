import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import type { Parish } from './mutations-parish';

const getParishes = (): Promise<Parish[]> =>
  api
    .get<{ results: Parish[] } | Parish[]>('/v1/availability/parishes/')
    .then((res) => (Array.isArray(res) ? res : res.results));

export const getParishesQueryOptions = () =>
  queryOptions({ queryKey: ['parishes'], queryFn: getParishes });

export const useParishes = () => useQuery(getParishesQueryOptions());
