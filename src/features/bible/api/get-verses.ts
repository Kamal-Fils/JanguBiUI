import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useQuery,
  queryOptions,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { components } from '@/types/api';

export type Verse = components['schemas']['VerseOutput'];

export type GetVersesOptions = {
  bookId: number;
  chapterNumber: number;
  limit?: number;
  offset?: number;
};

export const getVerses = async ({
  bookId,
  chapterNumber,
  ...options
}: GetVersesOptions): Promise<Verse[]> => {
  const res = (await api.get<{ results: Verse[] } | Verse[]>(
    `/v1/bible/books/${bookId}/chapters/${chapterNumber}/verses/`,
    { params: options },
  )) as { results: Verse[] } | Verse[];
  return Array.isArray(res) ? res : res.results;
};

export const getVersesQueryOptions = (options: GetVersesOptions) => {
  return queryOptions({
    queryKey: [
      'verses',
      options.bookId,
      options.chapterNumber,
      options.limit,
      options.offset,
    ],
    queryFn: () => getVerses(options),
  });
};

export const useVerses = (options: GetVersesOptions) =>
  useQuery(getVersesQueryOptions(options));

export const getInfiniteVersesQueryOptions = (
  options: Omit<GetVersesOptions, 'offset'>,
) => {
  return infiniteQueryOptions({
    queryKey: ['verses', options.bookId, options.chapterNumber, 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      getVerses({ ...options, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < (options.limit || 50)) {
        return undefined; // No more pages
      }
      return allPages.length * (options.limit || 50);
    },
  });
};

export const useInfiniteVerses = (options: Omit<GetVersesOptions, 'offset'>) =>
  useInfiniteQuery(getInfiniteVersesQueryOptions(options));
