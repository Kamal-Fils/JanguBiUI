import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export const useRegisterEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) =>
      api.post<void>(`/v1/agenda/events/${eventId}/register/`, {}),
    onSuccess: (_data, eventId) => {
      // Le fil lit ['events', params] → ['events'] l'invalide par préfixe.
      queryClient.invalidateQueries({ queryKey: ['events'] });
      // Invalide aussi la clé détail (utile dès qu'une page détail existera).
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
};
