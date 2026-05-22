import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { TransferRequest, transferRequestSchema } from '../types';

type AdminTransfersResponse = { count: number; results: TransferRequest[] };

const parseTransfers = (data: unknown): AdminTransfersResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => transferRequestSchema.parse(item)),
  };
};

export const getAdminTransfers = (): Promise<AdminTransfersResponse> =>
  api.get<unknown>('/v1/transfers/admin/').then(parseTransfers);

export const getAdminTransfersQueryOptions = (enabled: boolean) =>
  queryOptions({
    queryKey: ['transfers', 'admin'],
    queryFn: getAdminTransfers,
    enabled,
  });

export const useAdminTransfers = (enabled = true) =>
  useQuery(getAdminTransfersQueryOptions(enabled));
