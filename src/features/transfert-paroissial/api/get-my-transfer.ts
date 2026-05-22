import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { TransferRequest, transferRequestSchema } from '../types';

export const getMyTransfer = (): Promise<TransferRequest | null> =>
  api
    .get<unknown>('/v1/transfers/my-request/')
    .then((data) => transferRequestSchema.parse(data))
    .catch(() => null);

export const getMyTransferQueryOptions = () =>
  queryOptions({
    queryKey: ['transfers', 'my-request'],
    queryFn: getMyTransfer,
  });

export const useMyTransfer = () => useQuery(getMyTransferQueryOptions());
