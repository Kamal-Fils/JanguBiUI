import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const globalDashboardSchema = z.object({
  users_total: z.number(),
  users_new_30d: z.number(),
  fideles_count: z.number(),
  clergy_count: z.number(),
  pending_clergy_invitations: z.number(),
  provinces_count: z.number(),
  dioceses_count: z.number(),
  parishes_count: z.number(),
  articles_published: z.number(),
  pending_documents: z.number(),
  donations_total_year: z.coerce.number(),
});

export type GlobalDashboard = z.infer<typeof globalDashboardSchema>;

export const getGlobalDashboard = (): Promise<GlobalDashboard> =>
  api
    .get<unknown>('/v1/dashboards/global/')
    .then((data) => globalDashboardSchema.parse(data));

export const getGlobalDashboardQueryOptions = () =>
  queryOptions({
    queryKey: ['dashboard', 'global'],
    queryFn: getGlobalDashboard,
  });

export const useGlobalDashboard = () =>
  useQuery({ ...getGlobalDashboardQueryOptions(), retry: false });
