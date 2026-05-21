import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { ArticleCategory, articleCategorySchema } from '../types';

export const getCategories = (): Promise<ArticleCategory[]> =>
  api
    .get<unknown[]>('/v1/news/categories/')
    .then((data) =>
      (data as unknown[]).map((item) => articleCategorySchema.parse(item)),
    );

export const getCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: ['news-categories'],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  });

export const useCategories = () => useQuery(getCategoriesQueryOptions());
