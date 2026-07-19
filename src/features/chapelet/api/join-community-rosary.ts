import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { communityRosarySchema } from './get-community-rosaries';
import type { CommunityRosary } from './get-community-rosaries';

/**
 * POST /v1/rosary/community/{id}/join/
 *
 * Enregistre la participation (get_or_create côté serveur — idempotent) et
 * renvoie l'état AUTORITAIRE de la session : c'est ainsi qu'un fidèle qui
 * rejoint en cours de route affiche la bonne décade, et non `1` par défaut.
 * Le backend refuse (400) une session qui n'est plus `active`.
 */
export const joinCommunityRosary = (
  rosaryId: number,
): Promise<CommunityRosary> =>
  api
    .post<unknown>(`/v1/rosary/community/${rosaryId}/join/`)
    .then((res) => communityRosarySchema.parse(res));

export const useJoinCommunityRosary = ({
  onSuccess,
}: { onSuccess?: (rosary: CommunityRosary) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: joinCommunityRosary,
    onSuccess: (rosary) => {
      queryClient.invalidateQueries({ queryKey: ['community-rosaries'] });
      onSuccess?.(rosary);
    },
  });
};
