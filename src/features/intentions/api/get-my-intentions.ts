import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const intentionSchema = z.object({
  id: z.number(),
  intention_type: z.string(),
  intention_text: z.string(),
  status: z.string(),
  requestor_email: z.string().email(),
  pretre_email: z.string().email().nullable().optional(),
  parish_name: z.string().nullable().optional(),
  proposed_date: z.string().nullable().optional(),
  celebration_date: z.string().nullable().optional(),
  notes: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MassIntention = z.infer<typeof intentionSchema>;

type IntentionsResponse = { count: number; results: MassIntention[] };

const parseIntentions = (data: unknown): IntentionsResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => intentionSchema.parse(item)),
  };
};

export const getMyIntentions = (): Promise<IntentionsResponse> =>
  api.get<unknown>('/v1/mass-intentions/my/').then(parseIntentions);

export const getMyIntentionsQueryOptions = () =>
  queryOptions({ queryKey: ['mass-intentions-my'], queryFn: getMyIntentions });

export const useMyIntentions = () => useQuery(getMyIntentionsQueryOptions());
