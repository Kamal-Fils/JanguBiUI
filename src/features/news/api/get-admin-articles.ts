import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Article, articleSchema } from '../types';

export type AdminArticlesParams = {
  limit?: number;
  offset?: number;
  status?: string;
  content_type?: string;
};

export type AdminArticlesResponse = { count: number; results: Article[] };

const parseArticles = (data: unknown): AdminArticlesResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => articleSchema.parse(item)),
  };
};

export const getAdminArticles = (
  params?: AdminArticlesParams,
): Promise<AdminArticlesResponse> =>
  api.get<unknown>('/v1/news/admin/', { params }).then(parseArticles);

export const getAdminArticlesQueryOptions = (params?: AdminArticlesParams) =>
  queryOptions({
    queryKey: ['articles', 'admin', params],
    queryFn: () => getAdminArticles(params),
  });

export const useAdminArticles = (params?: AdminArticlesParams) =>
  useQuery(getAdminArticlesQueryOptions(params));
