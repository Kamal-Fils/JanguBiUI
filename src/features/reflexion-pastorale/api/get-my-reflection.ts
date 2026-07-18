import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { PastoralReflection, pastoralReflectionSchema } from '../types';

// `200 + null` = pas encore de réflexion aujourd'hui (état normal du composer).
// Les vraies erreurs remontent à React Query au lieu d'être avalées en null.
export const getMyTodayReflection = (): Promise<PastoralReflection | null> =>
  api
    .get<unknown>('/v1/spiritual/reflections/my-today/')
    .then((data) => (data ? pastoralReflectionSchema.parse(data) : null));

export const getMyTodayReflectionQueryOptions = () =>
  queryOptions({
    queryKey: ['reflexion-pastorale', 'my-today'],
    queryFn: getMyTodayReflection,
  });

export const useMyTodayReflection = () =>
  useQuery(getMyTodayReflectionQueryOptions());
