import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { components } from '@/types/api';

export type Book = components['schemas']['BookMetadataOutput'];

export type BookList = Book[];

export type GetBooksOptions = {
  testament?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
};

export const getBooks = async (
  options?: GetBooksOptions,
): Promise<BookList> => {
  const params = { limit: 100, offset: 0, ...options };
  const res = (await api.get<{ results: BookList } | BookList>(
    '/v1/bible/books/',
    { params },
  )) as { results: BookList } | BookList;
  return Array.isArray(res) ? res : res.results;
};

export const getBooksQueryOptions = (options?: GetBooksOptions) => {
  return queryOptions({
    queryKey: ['books', options],
    queryFn: () => getBooks(options),
  });
};

export const useBooks = (options?: GetBooksOptions) =>
  useQuery(getBooksQueryOptions(options));
