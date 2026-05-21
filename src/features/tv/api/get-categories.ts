import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { tvCategorySchema } from '../types';

const responseSchema = z.object({
  count: z.number(),
  results: z.array(tvCategorySchema),
});

export type TvCategoriesResponse = z.infer<typeof responseSchema>;

export const getTvCategories = (): Promise<TvCategoriesResponse> =>
  api
    .get<unknown>('/v1/tv/categories/')
    .then((data) => responseSchema.parse(data));

export const getTvCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: ['tv-categories'],
    queryFn: getTvCategories,
  });

export const useTvCategories = () => useQuery(getTvCategoriesQueryOptions());
