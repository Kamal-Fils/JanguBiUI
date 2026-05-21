import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { tvVideoSchema } from '../types';

const responseSchema = z.object({
  count: z.number(),
  results: z.array(tvVideoSchema),
});

export type TvVideosResponse = z.infer<typeof responseSchema>;

export const getTvVideos = (categorySlug?: string): Promise<TvVideosResponse> =>
  api
    .get<unknown>('/v1/tv/videos/', {
      params: categorySlug ? { category__slug: categorySlug } : undefined,
    })
    .then((data) => responseSchema.parse(data));

export const getTvVideosQueryOptions = (categorySlug?: string) =>
  queryOptions({
    queryKey: ['tv-videos', categorySlug ?? null],
    queryFn: () => getTvVideos(categorySlug),
  });

export const useTvVideos = (categorySlug?: string) =>
  useQuery(getTvVideosQueryOptions(categorySlug));
