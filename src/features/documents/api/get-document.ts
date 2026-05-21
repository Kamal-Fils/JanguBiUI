import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { DocumentRequestDetail, documentRequestDetailSchema } from '../types';

export const getDocumentRequest = (
  id: string,
): Promise<DocumentRequestDetail> =>
  api
    .get<unknown>(`/v1/documents/requests/${id}/`)
    .then((data) => documentRequestDetailSchema.parse(data));

export const getDocumentRequestQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['documents', 'requests', id],
    queryFn: () => getDocumentRequest(id),
    enabled: !!id,
  });

export const useDocumentRequest = (id: string) =>
  useQuery(getDocumentRequestQueryOptions(id));
