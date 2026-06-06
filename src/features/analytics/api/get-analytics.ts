import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const bucketSchema = z.object({
  bucket: z.string().nullable(),
  total: z.number(),
  count: z.number(),
});

const namedTotalSchema = z.object({
  id: z.union([z.number(), z.string()]).nullable(),
  name: z.string().nullable(),
  total: z.number(),
  count: z.number(),
});

export const analyticsSchema = z.object({
  level: z.enum(['parish', 'diocese', 'province']),
  entity: z.object({ id: z.number(), name: z.string() }).nullable(),
  ranking_level: z.enum(['church', 'parish', 'diocese']),
  period: z.object({
    from: z.string(),
    to: z.string(),
    granularity: z.string(),
  }),
  kpis: z.object({
    donations_total: z.number(),
    donations_count: z.number(),
    donations_total_prev: z.number(),
    delta_pct: z.number().nullable(),
    denier_rate: z.number(),
    fideles: z.number(),
    fideles_new: z.number(),
    active_units: z.number(),
    total_units: z.number(),
  }),
  series: z.array(bucketSchema),
  by_type: z.array(
    z.object({
      donation_type: z.string(),
      label: z.string(),
      total: z.number(),
      count: z.number(),
    }),
  ),
  by_provider: z.array(
    z.object({
      provider: z.string(),
      label: z.string(),
      total: z.number(),
      count: z.number(),
    }),
  ),
  ranking: z.array(namedTotalSchema),
});

export type Analytics = z.infer<typeof analyticsSchema>;

export type AnalyticsFilters = {
  period?: string;
  from?: string;
  to?: string;
  granularity?: string;
  type?: string;
  status?: string;
  provider?: string;
  parish?: number;
  diocese?: number;
};

export const getAnalytics = (
  filters: AnalyticsFilters = {},
): Promise<Analytics> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
  });
  const qs = params.toString();
  return api
    .get<unknown>(`/v1/dashboards/analytics/${qs ? `?${qs}` : ''}`)
    .then((data) => analyticsSchema.parse(data));
};

export const getAnalyticsQueryOptions = (filters: AnalyticsFilters = {}) =>
  queryOptions({
    queryKey: ['analytics', filters],
    queryFn: () => getAnalytics(filters),
    retry: false,
  });

export const useAnalytics = (filters: AnalyticsFilters = {}) =>
  useQuery(getAnalyticsQueryOptions(filters));
