import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { DocumentRequest, DocumentStatus, documentRequestSchema } from '../types';

export type DocumentsResponse = { count: number; results: DocumentRequest[] };

const parseDocuments = (data: unknown): DocumentsResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => documentRequestSchema.parse(item)),
  };
};

export type DocumentsParams = { status?: DocumentStatus };

export const getDocumentRequests = (params?: DocumentsParams): Promise<DocumentsResponse> =>
  api.get<unknown>('/v1/documents/requests/', { params }).then(parseDocuments);

export const getDocumentRequestsQueryOptions = (params?: DocumentsParams) =>
  queryOptions({
    queryKey: ['documents', 'requests', params],
    queryFn: () => getDocumentRequests(params),
  });

export const useDocumentRequests = (params?: DocumentsParams) =>
  useQuery(getDocumentRequestsQueryOptions(params));
