import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';

import { MessagesResponse, messageSchema } from '../types';

export type { MessagesResponse } from '../types';

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
    enabled: !!conversationId,
  });
};
