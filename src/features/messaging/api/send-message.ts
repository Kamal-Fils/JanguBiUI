import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Message, MessagesResponse, messageSchema } from '../types';

export type SendMessageInput = { content: string };

export const sendMessage = (
  conversationId: string,
  data: SendMessageInput,
): Promise<Message> =>
  api
    .post<unknown>(
      `/v1/messaging/conversations/${conversationId}/messages/send/`,
      data,
    )
    .then((res) => messageSchema.parse(res));

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageInput) => sendMessage(conversationId, data),
    onSuccess: (message) => {
      const sent: Message = { ...message, is_mine: true };
      queryClient.setQueryData<MessagesResponse>(
        ['messages', conversationId],
        (old) => {
          if (!old) return { count: 1, results: [sent] };
          if (old.results.some((m) => m.id === sent.id)) return old;
          return {
            count: old.count + 1,
            results: [...old.results, sent],
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
