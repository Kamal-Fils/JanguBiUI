import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const dioceseSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  parishes_count: z.number(),
  fideles_count: z.number(),
  pending_documents: z.number(),
});

export const provinceDashboardSchema = z.object({
  province: z.object({ id: z.number(), name: z.string() }),
  dioceses_count: z.number(),
  parishes_count: z.number(),
  total_fideles: z.number(),
  donations_total_year: z.coerce.number(),
  pending_documents: z.number(),
  dioceses: z.array(dioceseSummarySchema),
});

export type ProvinceDashboard = z.infer<typeof provinceDashboardSchema>;
export type DioceseSummary = z.infer<typeof dioceseSummarySchema>;

export const getMyProvinceDashboard = (): Promise<ProvinceDashboard> =>
  api
    .get<unknown>('/v1/dashboards/my-province/')
    .then((data) => provinceDashboardSchema.parse(data));

export const getMyProvinceDashboardQueryOptions = () =>
  queryOptions({
    queryKey: ['dashboard', 'my-province'],
    queryFn: getMyProvinceDashboard,
  });

export const useMyProvinceDashboard = () =>
  useQuery({ ...getMyProvinceDashboardQueryOptions(), retry: false });
