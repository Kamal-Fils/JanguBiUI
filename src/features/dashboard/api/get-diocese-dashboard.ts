import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const dioceseDashboardSchema = z.object({
  diocese: z.object({
    id: z.number(),
    name: z.string(),
    province: z.string(),
  }),
  parishes_count: z.number(),
  total_fideles: z.number(),
  donations_total: z.coerce.number(),
  parishes_without_main_church: z.number(),
  pending_documents: z.number(),
});

export type DioceseDashboard = z.infer<typeof dioceseDashboardSchema>;

export const getMyDioceseDashboard = (): Promise<DioceseDashboard> =>
  api
    .get<unknown>('/v1/dashboards/my-diocese/')
    .then((data) => dioceseDashboardSchema.parse(data));

export const getMyDioceseDashboardQueryOptions = () =>
  queryOptions({
    queryKey: ['dashboard', 'my-diocese'],
    queryFn: getMyDioceseDashboard,
  });

export const useMyDioceseDashboard = () =>
  useQuery({ ...getMyDioceseDashboardQueryOptions(), retry: false });
