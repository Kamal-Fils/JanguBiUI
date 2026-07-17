import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';

const cguStatusSchema = z.object({
  accepted: z.boolean(),
  accepted_at: z.string().nullable(),
});

export type MessagingCguStatus = z.infer<typeof cguStatusSchema>;

export const getMessagingCguStatus = (): Promise<MessagingCguStatus> =>
  api.get<unknown>('/v1/messaging/cgu/').then((d) => cguStatusSchema.parse(d));

/**
 * Statut GLOBAL d'acceptation des CGU de messagerie (par utilisateur).
 * Permet d'afficher le gate CGU de façon proactive au lieu de laisser
 * l'utilisateur découvrir un 403 surprise en ouvrant une conversation.
 */
export const useMessagingCguStatus = () => {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['messaging-cgu'],
    queryFn: getMessagingCguStatus,
    enabled: !!user?.id,
    staleTime: Infinity,
    retry: false,
  });
};

export const acceptMessagingCgu = (): Promise<MessagingCguStatus> =>
  api.post<unknown>('/v1/messaging/cgu/').then((d) => cguStatusSchema.parse(d));

/**
 * Accepte les CGU de messagerie — GLOBALEMENT, une fois pour toutes les
 * conversations (l'ancien endpoint par conversation redemandait les CGU à
 * chaque nouveau correspondant → 403 répétés). Au succès, on invalide le
 * statut CGU, le fil éventuellement bloqué en 403 et la liste.
 */
export const useAcceptMessagingCgu = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => acceptMessagingCgu(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging-cgu'] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
