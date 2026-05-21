import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { ArticleDetail, articleDetailSchema } from '../types';

export const getArticleDetail = (articleId: string): Promise<ArticleDetail> =>
  api
    .get<unknown>(`/v1/news/${articleId}/`)
    .then((data) => articleDetailSchema.parse(data));

export const getArticleDetailQueryOptions = (articleId: string) =>
  queryOptions({
    queryKey: ['articles', 'detail', articleId],
    queryFn: () => getArticleDetail(articleId),
    enabled: !!articleId,
  });

export const useArticleDetail = (articleId: string) =>
  useQuery(getArticleDetailQueryOptions(articleId));
