import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export const acceptMessagingCgu = (conversationId: string): Promise<unknown> =>
  api.post<unknown>(`/v1/messaging/conversations/${conversationId}/cgu/`);

/**
 * Accepte les CGU de messagerie pour une conversation.
 * Au succès, on invalide le fil de messages (qui était bloqué en 403) et la
 * liste des conversations, pour que le contenu se recharge automatiquement.
 */
export const useAcceptMessagingCgu = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => acceptMessagingCgu(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
