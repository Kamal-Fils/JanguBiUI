import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const fideleDashboardSchema = z.object({
  parish: z
    .object({ id: z.number(), name: z.string(), city: z.string() })
    .nullable(),
  principal_cure_email: z.string().nullable(),
  documents: z.object({
    total: z.number(),
    in_progress: z.number(),
    deposited: z.number(),
  }),
  mass_intentions: z.number(),
  donations: z.object({ total: z.coerce.number(), count: z.number() }),
});

export type FideleDashboard = z.infer<typeof fideleDashboardSchema>;

export const getFideleDashboard = (): Promise<FideleDashboard> =>
  api.get<unknown>('/v1/dashboards/me/').then((data) => fideleDashboardSchema.parse(data));

export const getFideleDashboardQueryOptions = () =>
  queryOptions({ queryKey: ['dashboard', 'me'], queryFn: getFideleDashboard });

export const useFideleDashboard = () =>
  useQuery({ ...getFideleDashboardQueryOptions(), retry: false });
