import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const donationFlowSchema = z.object({
  total: z.coerce.number(),
  count: z.number(),
  by_type: z.array(
    z.object({
      donation_type: z.string(),
      total: z.coerce.number(),
      count: z.number(),
    }),
  ),
});

export const parishDashboardSchema = z.object({
  parish: z.object({
    id: z.number(),
    name: z.string(),
    city: z.string(),
    diocese: z.string(),
  }),
  total_fideles: z.number(),
  followers: z.number(),
  donation_flow_year: donationFlowSchema,
  donation_flow_month: donationFlowSchema,
  pending_documents: z.number(),
  pending_intentions: z.number(),
  churches: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      church_type: z.string(),
      is_main: z.boolean(),
      is_active: z.boolean(),
    }),
  ),
  clergy: z.array(
    z.object({
      id: z.string(),
      email: z.string(),
      pastoral_role: z.string().nullable(),
      is_principal: z.boolean(),
    }),
  ),
});

export type ParishDashboard = z.infer<typeof parishDashboardSchema>;

export const getMyParishDashboard = (): Promise<ParishDashboard> =>
  api
    .get<unknown>('/v1/dashboards/my-parish/')
    .then((data) => parishDashboardSchema.parse(data));

export const getMyParishDashboardQueryOptions = () =>
  queryOptions({
    queryKey: ['dashboard', 'my-parish'],
    queryFn: getMyParishDashboard,
  });

export const useMyParishDashboard = () =>
  useQuery({ ...getMyParishDashboardQueryOptions(), retry: false });
