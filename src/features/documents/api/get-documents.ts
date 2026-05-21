import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { DocumentRequest, documentRequestSchema } from '../types';

export type DocumentsResponse = { count: number; results: DocumentRequest[] };

const parseDocuments = (data: unknown): DocumentsResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => documentRequestSchema.parse(item)),
  };
};

export const getDocumentRequests = (): Promise<DocumentsResponse> =>
  api.get<unknown>('/v1/documents/requests/').then(parseDocuments);

export const getDocumentRequestsQueryOptions = () =>
  queryOptions({
    queryKey: ['documents', 'requests'],
    queryFn: getDocumentRequests,
  });

export const useDocumentRequests = () =>
  useQuery(getDocumentRequestsQueryOptions());
