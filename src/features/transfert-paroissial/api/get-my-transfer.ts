import { queryOptions, useQuery } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api-client';

import { TransferRequest, transferRequestSchema } from '../types';

export const getMyTransfer = (): Promise<TransferRequest | null> =>
  api
    .get<unknown>('/v1/transfers/my-request/')
    .then((data) => transferRequestSchema.parse(data))
    .catch((err: unknown) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    });

export const getMyTransferQueryOptions = () =>
  queryOptions({
    queryKey: ['transfers', 'my-request'],
    queryFn: getMyTransfer,
    retry: false,
  });

export const useMyTransfer = () => useQuery(getMyTransferQueryOptions());
