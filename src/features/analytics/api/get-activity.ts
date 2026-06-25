import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import type { AnalyticsFilters } from './get-analytics';

const byStatusSchema = z.array(
  z.object({ status: z.string(), label: z.string(), count: z.number() }),
);

export const activitySchema = z.object({
  level: z.enum(['parish', 'diocese', 'province']),
  grain: z.enum(['church', 'parish', 'diocese']),
  rows: z.array(
    z.object({
      id: z.number().nullable(),
      name: z.string().nullable(),
      donations_total: z.number(),
      fideles: z.number(),
      documents_pending: z.number().nullable(),
      intentions_pending: z.number().nullable(),
    }),
  ),
  documents: z.object({
    by_status: byStatusSchema,
    pending: z.number(),
    total: z.number(),
  }),
  intentions: z.object({
    by_status: byStatusSchema,
    pending: z.number(),
    total: z.number(),
  }),
});

export type Activity = z.infer<typeof activitySchema>;

export const getActivity = (
  filters: AnalyticsFilters = {},
): Promise<Activity> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
  });
  const qs = params.toString();
  return api
    .get<unknown>(`/v1/dashboards/analytics/activity/${qs ? `?${qs}` : ''}`)
    .then((data) => activitySchema.parse(data));
};

export const getActivityQueryOptions = (filters: AnalyticsFilters = {}) =>
  queryOptions({
    queryKey: ['analytics-activity', filters],
    queryFn: () => getActivity(filters),
    retry: false,
  });

export const useActivity = (filters: AnalyticsFilters = {}) =>
  useQuery(getActivityQueryOptions(filters));
