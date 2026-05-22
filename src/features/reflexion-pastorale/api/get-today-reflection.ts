import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { PastoralReflection, pastoralReflectionSchema } from '../types';

export const getTodayReflection = (): Promise<PastoralReflection | null> =>
  api
    .get<unknown>('/v1/spiritual/reflections/today/')
    .then((data) => pastoralReflectionSchema.parse(data))
    .catch(() => null);

export const getTodayReflectionQueryOptions = () =>
  queryOptions({
    queryKey: ['reflexion-pastorale', 'today'],
    queryFn: getTodayReflection,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

export const useTodayReflection = () => useQuery(getTodayReflectionQueryOptions());
