import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Conversation, conversationSchema } from '../types';

export const getConversation = (id: string): Promise<Conversation> =>
  api
    .get<unknown>(`/v1/messaging/conversations/${id}/`)
    .then((data) => conversationSchema.parse(data));

export const getConversationQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['conversations', id],
    queryFn: () => getConversation(id),
    enabled: !!id,
  });

export const useGetConversation = (id: string) =>
  useQuery(getConversationQueryOptions(id));
