import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export interface SubmitIntentionInput {
  rosaryId: number;
  text: string;
}

/**
 * POST /v1/rosary/community/{id}/intentions/ → 201 sans corps.
 *
 * ATTENTION — cet endpoint PERSISTE l'intention mais ne la DIFFUSE pas au
 * groupe : seule l'action WebSocket `submit_intention` déclenche le
 * `group_send` (cf. `apps/rosary/consumers.py`). Il sert donc de repli quand le
 * socket est fermé : l'intention est enregistrée, les autres participants la
 * verront au prochain chargement plutôt qu'en direct.
 */
export const submitRosaryIntention = ({
  rosaryId,
  text,
}: SubmitIntentionInput): Promise<void> =>
  api.post<void>(`/v1/rosary/community/${rosaryId}/intentions/`, { text });

export const useSubmitRosaryIntention = ({
  onSuccess,
}: { onSuccess?: (input: SubmitIntentionInput) => void } = {}) =>
  useMutation({
    mutationFn: submitRosaryIntention,
    onSuccess: (_data, input) => onSuccess?.(input),
  });
