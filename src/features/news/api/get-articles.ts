import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Article, articleSchema } from '../types';

export type ScopeTypeFilter = 'global' | 'diocese' | 'parish' | 'church';

export type GetArticlesParams = {
  limit?: number;
  offset?: number;
  // Filtre de portée (feed) — borné serveur aux appartenances de l'utilisateur.
  scope_type?: ScopeTypeFilter;
  scope_id?: number;
};
export type ArticlesResponse = { count: number; results: Article[] };

const parseArticles = (data: unknown): ArticlesResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => articleSchema.parse(item)),
  };
};

export const getGlobalArticles = (
  params?: GetArticlesParams,
): Promise<ArticlesResponse> =>
  api.get<unknown>('/v1/news/', { params }).then(parseArticles);

// Fil AGRÉGÉ de l'utilisateur (global ∪ église ∪ paroisse ∪ diocèse) — Chantier 7b.
export const getFeedArticles = (
  params?: GetArticlesParams,
): Promise<ArticlesResponse> =>
  api.get<unknown>('/v1/news/feed/', { params }).then(parseArticles);

export const getParishArticles = (
  params?: GetArticlesParams,
): Promise<ArticlesResponse> =>
  api.get<unknown>('/v1/news/my-parish/', { params }).then(parseArticles);

export const getDioceseArticles = (
  dioceseId: number,
  params?: GetArticlesParams,
): Promise<ArticlesResponse> =>
  api
    .get<unknown>(`/v1/news/diocese/${dioceseId}/`, { params })
    .then(parseArticles);

export const getGlobalArticlesQueryOptions = (params?: GetArticlesParams) =>
  queryOptions({
    queryKey: ['articles', 'global', params],
    queryFn: () => getGlobalArticles(params),
  });

export const getParishArticlesQueryOptions = (params?: GetArticlesParams) =>
  queryOptions({
    queryKey: ['articles', 'parish', params],
    queryFn: () => getParishArticles(params),
  });

export const getDioceseArticlesQueryOptions = (
  dioceseId: number,
  params?: GetArticlesParams,
) =>
  queryOptions({
    queryKey: ['articles', 'diocese', dioceseId, params],
    queryFn: () => getDioceseArticles(dioceseId, params),
    enabled: !!dioceseId,
  });

export const getFeedArticlesQueryOptions = (params?: GetArticlesParams) =>
  queryOptions({
    queryKey: ['articles', 'feed', params],
    queryFn: () => getFeedArticles(params),
  });

export const useGlobalArticles = (params?: GetArticlesParams) =>
  useQuery(getGlobalArticlesQueryOptions(params));

export const useFeedArticles = (params?: GetArticlesParams) =>
  useQuery(getFeedArticlesQueryOptions(params));

export const useParishArticles = (params?: GetArticlesParams) =>
  useQuery(getParishArticlesQueryOptions(params));

export const useDioceseArticles = (
  dioceseId: number | undefined,
  params?: GetArticlesParams,
) => useQuery(getDioceseArticlesQueryOptions(dioceseId ?? 0, params));
