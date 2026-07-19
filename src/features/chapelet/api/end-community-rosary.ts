import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { communityRosarySchema } from './get-community-rosaries';
import type { CommunityRosary } from './get-community-rosaries';

/**
 * POST /v1/rosary/community/{id}/end/ — réservé à l'initiateur (400 sinon).
 *
 * Comme pour les intentions, la voie REST ne diffuse PAS `rosary_ended` au
 * groupe : elle sert de repli lorsque le socket de l'initiateur est fermé. Tant
 * que le socket est ouvert, on termine par l'action WebSocket `end`, seule
 * capable de prévenir les autres participants en direct.
 */
export const endCommunityRosary = (
  rosaryId: number,
): Promise<CommunityRosary> =>
  api
    .post<unknown>(`/v1/rosary/community/${rosaryId}/end/`)
    .then((res) => communityRosarySchema.parse(res));

export const useEndCommunityRosary = ({
  onSuccess,
}: { onSuccess?: (rosary: CommunityRosary) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endCommunityRosary,
    onSuccess: (rosary) => {
      queryClient.invalidateQueries({ queryKey: ['community-rosaries'] });
      onSuccess?.(rosary);
    },
  });
};
