import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';

import { Conversation, conversationSchema } from '../types';

export type ConversationsResponse = { count: number; results: Conversation[] };

const parseConversations = (data: unknown): ConversationsResponse => {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      results: data.map((item) => conversationSchema.parse(item)),
    };
  }
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count ?? 0,
    results: (raw.results ?? []).map((item) => conversationSchema.parse(item)),
  };
};

export const getConversations = (
  search?: string,
): Promise<ConversationsResponse> =>
  api
    .get<unknown>('/v1/messaging/conversations/', {
      params: search ? { search } : undefined,
    })
    .then(parseConversations);

export const getConversationsQueryOptions = (search?: string) =>
  queryOptions({
    queryKey: ['conversations', { search }],
    queryFn: () => getConversations(search),
    refetchInterval: 30_000,
  });

export const useConversations = (search?: string) => {
  const { data: user } = useUser();
  return useQuery({
    ...getConversationsQueryOptions(search),
    enabled: !!user?.id,
  });
};
