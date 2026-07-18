import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { PastoralReflection, pastoralReflectionSchema } from '../types';

// Le backend renvoie `200 + null` quand aucune réflexion n'est publiée ce jour
// (≠ 404) : on distingue donc « pas de réflexion » (null) d'une vraie erreur
// réseau/serveur, qui remonte à React Query (isError) au lieu d'être avalée.
export const getTodayReflection = (): Promise<PastoralReflection | null> =>
  api
    .get<unknown>('/v1/spiritual/reflections/today/')
    .then((data) => (data ? pastoralReflectionSchema.parse(data) : null));

export const getTodayReflectionQueryOptions = () =>
  queryOptions({
    queryKey: ['reflexion-pastorale', 'today'],
    queryFn: getTodayReflection,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

export const useTodayReflection = () =>
  useQuery(getTodayReflectionQueryOptions());
