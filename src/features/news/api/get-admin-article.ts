import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { ArticleDetail, articleDetailSchema } from '../types';

export const getAdminArticleDetail = (articleId: string): Promise<ArticleDetail> =>
  api
    .get<unknown>(`/v1/news/admin/${articleId}/`)
    .then((data) => articleDetailSchema.parse(data));

export const getAdminArticleDetailQueryOptions = (articleId: string) =>
  queryOptions({
    queryKey: ['articles', 'admin', 'detail', articleId],
    queryFn: () => getAdminArticleDetail(articleId),
    enabled: !!articleId,
  });

export const useAdminArticleDetail = (articleId: string) =>
  useQuery(getAdminArticleDetailQueryOptions(articleId));
