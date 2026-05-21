import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const clergicalMessageSchema = z.object({
  id: z.number(),
  sender_email: z.string().email(),
  recipient_scope: z.string(),
  scope_id: z.number().nullable().optional(),
  recipient_email: z.string().email().nullable().optional(),
  subject: z.string(),
  body: z.string(),
  read_at: z.string().nullable().optional(),
  created_at: z.string(),
});

export type ClergicalMessage = z.infer<typeof clergicalMessageSchema>;

type InboxResponse = {
  count: number;
  results: ClergicalMessage[];
};

const parseInbox = (data: unknown): InboxResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => clergicalMessageSchema.parse(item)),
  };
};

export const getClericalInbox = (): Promise<InboxResponse> =>
  api.get<unknown>('/v1/messaging/clerical/inbox/').then(parseInbox);

export const getClericalInboxQueryOptions = () =>
  queryOptions({
    queryKey: ['clerical-inbox'],
    queryFn: getClericalInbox,
  });

export const useClericalInbox = () => useQuery(getClericalInboxQueryOptions());
