import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { DocumentRequest, documentRequestSchema } from '../types';

export type AdminDocumentsParams = {
  limit?: number;
  offset?: number;
  status?: string;
};

export type AdminDocumentsResponse = {
  count: number;
  results: DocumentRequest[];
};

const parseDocuments = (data: unknown): AdminDocumentsResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => documentRequestSchema.parse(item)),
  };
};

export const getAdminDocuments = (
  params?: AdminDocumentsParams,
): Promise<AdminDocumentsResponse> =>
  api
    .get<unknown>('/v1/documents/admin/requests/', { params })
    .then(parseDocuments);

export const getAdminDocumentsQueryOptions = (params?: AdminDocumentsParams) =>
  queryOptions({
    queryKey: ['documents', 'admin', params],
    queryFn: () => getAdminDocuments(params),
  });

export const useAdminDocuments = (params?: AdminDocumentsParams) =>
  useQuery(getAdminDocumentsQueryOptions(params));
