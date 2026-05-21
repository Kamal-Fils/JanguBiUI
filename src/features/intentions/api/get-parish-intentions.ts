import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type MassIntention, intentionSchema } from './get-my-intentions';

type IntentionsResponse = { count: number; results: MassIntention[] };

const parseIntentions = (data: unknown): IntentionsResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => intentionSchema.parse(item)),
  };
};

export const getParishIntentions = (): Promise<IntentionsResponse> =>
  api.get<unknown>('/v1/mass-intentions/parish/').then(parseIntentions);

export const getParishIntentionsQueryOptions = () =>
  queryOptions({
    queryKey: ['mass-intentions-parish'],
    queryFn: getParishIntentions,
  });

export const useParishIntentions = () =>
  useQuery(getParishIntentionsQueryOptions());
