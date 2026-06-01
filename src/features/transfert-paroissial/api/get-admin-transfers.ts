import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { transferRequestSchema } from '../types';

const adminTransfersResponseSchema = z.object({
  count: z.number(),
  results: z.array(transferRequestSchema),
});

type AdminTransfersResponse = z.infer<typeof adminTransfersResponseSchema>;

export const getAdminTransfers = (): Promise<AdminTransfersResponse> =>
  api.get<unknown>('/v1/transfers/admin/').then((data) =>
    adminTransfersResponseSchema.parse(data),
  );

export const getAdminTransfersQueryOptions = (enabled: boolean) =>
  queryOptions({
    queryKey: ['transfers', 'admin'],
    queryFn: getAdminTransfers,
    enabled,
  });

export const useAdminTransfers = (enabled = true) =>
  useQuery(getAdminTransfersQueryOptions(enabled));
