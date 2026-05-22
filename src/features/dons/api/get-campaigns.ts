import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const campaignSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  donation_type: z.string(),
  target_amount: z.string().nullable().optional(),
  currency: z.string(),
  scope_type: z.string(),
  is_active: z.boolean(),
  starts_at: z.string(),
  ends_at: z.string().nullable().optional(),
  created_by_email: z.string().email().nullable().optional(),
  total_donations: z.number(),
});

export type DonationCampaign = z.infer<typeof campaignSchema>;

type CampaignsResponse = { count: number; results: DonationCampaign[] };

const parseCampaigns = (data: unknown): CampaignsResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => campaignSchema.parse(item)),
  };
};

export const getCampaigns = (): Promise<CampaignsResponse> =>
  api.get<unknown>('/v1/donations/campaigns/').then(parseCampaigns);

export const getCampaignsQueryOptions = () =>
  queryOptions({ queryKey: ['donation-campaigns'], queryFn: getCampaigns, retry: false });

export const useCampaigns = () => useQuery(getCampaignsQueryOptions());
