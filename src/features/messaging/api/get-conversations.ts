import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';

import { Conversation, conversationSchema } from '../types';

export type ConversationsResponse = { count: number; results: Conversation[] };

const parseConversations = (data: unknown): ConversationsResponse => {
  const items = Array.isArray(data)
    ? data
    : ((data as { results?: unknown[] })?.results ?? []);

  // safeParse ligne par ligne : une seule entrée malformée ne doit pas blanchir
  // toute la liste (avec .parse en cascade, l'utilisateur voyait « Impossible
  // de charger vos messages » pour UNE conversation hors schéma).
  const results = items.flatMap((item) => {
    const parsed = conversationSchema.safeParse(item);
    if (!parsed.success) {
      console.warn(
        '[conversations] entrée ignorée (schéma invalide)',
        parsed.error.issues,
      );
      return [];
    }
    return [parsed.data];
  });

  return { count: results.length, results };
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
