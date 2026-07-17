import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';

import { MessagesResponse, messageSchema } from '../types';

export type { MessagesResponse } from '../types';

/** Taille de page du backend (limit par défaut de message_list). */
export const MESSAGES_PAGE_SIZE = 30;

export const parseMessages = (
  data: unknown,
  currentUserId?: string,
): MessagesResponse => {
  const items: unknown[] = Array.isArray(data)
    ? data
    : ((data as { results?: unknown[] })?.results ?? []);

  const count = Array.isArray(data)
    ? items.length
    : ((data as { count?: number })?.count ?? items.length);

  return {
    count,
    // Backend returns newest-first; reverse so oldest renders at top, newest at bottom
    results: items
      .map((item) => {
        const msg = messageSchema.parse(item);
        return {
          ...msg,
          is_mine: currentUserId
            ? msg.sender_id === currentUserId
            : msg.is_mine,
        };
      })
      .reverse(),
  };
};

export const getMessages = (
  conversationId: string,
  currentUserId?: string,
): Promise<MessagesResponse> =>
  api
    .get<unknown>(`/v1/messaging/conversations/${conversationId}/messages/`)
    .then((data) => parseMessages(data, currentUserId));

export const useGetMessages = (conversationId: string) => {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId, user?.id),
    enabled: !!conversationId && !!user,
  });
};

export const getOlderMessages = (
  conversationId: string,
  beforeId: string,
  currentUserId?: string,
): Promise<MessagesResponse> =>
  api
    .get<unknown>(`/v1/messaging/conversations/${conversationId}/messages/`, {
      params: { before_id: beforeId, limit: MESSAGES_PAGE_SIZE },
    })
    .then((data) => parseMessages(data, currentUserId));

/**
 * Pagination curseur du fil : charge la page AVANT le plus ancien message
 * affiché (before_id, supporté par le backend depuis toujours mais jamais
 * câblé — le fil était plafonné aux 30 derniers messages) et la préprend au
 * cache avec dédoublonnage.
 */
export const useLoadOlderMessages = (conversationId: string) => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  return useMutation({
    mutationFn: (beforeId: string) =>
      getOlderMessages(conversationId, beforeId, user?.id),
    onSuccess: (older) => {
      queryClient.setQueryData<MessagesResponse>(
        ['messages', conversationId],
        (old) => {
          if (!old) return older;
          const known = new Set(old.results.map((m) => m.id));
          const fresh = older.results.filter((m) => !known.has(m.id));
          return {
            count: old.count + fresh.length,
            results: [...fresh, ...old.results],
          };
        },
      );
    },
  });
};
