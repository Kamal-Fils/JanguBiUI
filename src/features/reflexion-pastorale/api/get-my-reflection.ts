import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { PastoralReflection, pastoralReflectionSchema } from '../types';

export const getMyTodayReflection = (): Promise<PastoralReflection | null> =>
  api
    .get<unknown>('/v1/spiritual/reflections/my-today/')
    .then((data) => pastoralReflectionSchema.parse(data))
    .catch(() => null);

export const getMyTodayReflectionQueryOptions = () =>
  queryOptions({
    queryKey: ['reflexion-pastorale', 'my-today'],
    queryFn: getMyTodayReflection,
  });

export const useMyTodayReflection = () => useQuery(getMyTodayReflectionQueryOptions());
