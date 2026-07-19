import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { components } from '@/types/api';
import type { Expect, Matches } from '@/types/api-contract';

/**
 * GET /v1/rosary/community/{id}/intentions/ — intentions DÉJÀ déposées.
 *
 * Pourquoi cet appel existe : le WebSocket ne diffuse que ce qui est émis
 * depuis l'ouverture du socket. Un fidèle qui rejoignait en cours de chapelet
 * lisait donc « Aucune intention confiée pour l'instant » alors que la
 * communauté priait déjà pour dix d'entre elles.
 *
 * RBAC serveur : participants + initiateur. Tout autre compte authentifié
 * reçoit un 403 — une intention de prière n'est pas publique (cf.
 * `community_rosary_can_read_intentions`). L'appelant doit traiter ce refus
 * comme une absence d'historique, pas comme une panne.
 *
 * Le schéma zod valide la réponse à l'exécution ; une garde de compilation
 * (plus bas) vérifie en plus qu'il décrit la MÊME forme que le contrat serveur.
 */
export const rosaryIntentionSchema = z.object({
  id: z.number(),
  text: z.string(),
  // Volontairement la MÊME clé que la trame temps réel `intention_submitted`
  // (choix serveur assumé) : historique et direct fusionnent sans conversion.
  // `null` quand l'auteur a été supprimé — le serializer renvoie alors None.
  submitted_by: z.string().nullable(),
  created_at: z.string(),
});

export type RosaryIntention = z.infer<typeof rosaryIntentionSchema>;

/**
 * Garde de compilation, dans les deux sens : un champ ajouté, retiré ou renommé
 * côté serveur casse le build plutôt qu'un écran en production.
 */
type _IntentionMatchesContract = Expect<
  Matches<RosaryIntention, components['schemas']['IntentionOutput']>
>;

// Enveloppe `LimitOffsetPagination` du projet : {limit, offset, count, next,
// previous, results}. On ne valide que ce que l'écran consomme.
const rosaryIntentionsResponseSchema = z.object({
  count: z.number(),
  results: z.array(rosaryIntentionSchema),
});

export type RosaryIntentionsResponse = z.infer<
  typeof rosaryIntentionsResponseSchema
>;

interface GetRosaryIntentionsParams {
  rosaryId: number;
  /** Défaut serveur 50, plafond 200. */
  limit?: number;
  offset?: number;
}

export const getRosaryIntentions = ({
  rosaryId,
  limit,
  offset,
}: GetRosaryIntentionsParams): Promise<RosaryIntentionsResponse> => {
  const query = new URLSearchParams();
  if (limit !== undefined) query.set('limit', String(limit));
  if (offset !== undefined) query.set('offset', String(offset));
  const qs = query.toString();

  return api
    .get<unknown>(
      `/v1/rosary/community/${rosaryId}/intentions/${qs ? `?${qs}` : ''}`,
    )
    .then((data) => rosaryIntentionsResponseSchema.parse(data));
};

export const getRosaryIntentionsQueryOptions = ({
  rosaryId,
  limit,
  offset,
  enabled = true,
}: GetRosaryIntentionsParams & { enabled?: boolean }) =>
  queryOptions({
    queryKey: ['rosary-intentions', rosaryId, limit, offset],
    queryFn: () => getRosaryIntentions({ rosaryId, limit, offset }),
    enabled,
    // L'historique est un instantané d'amorçage : une fois chargé, c'est le
    // socket qui porte la suite. Un refetch (focus fenêtre, remontage) rejouerait
    // la fusion sans rien apporter, et rendrait le dédoublonnage observable.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

export const useRosaryIntentions = (
  params: GetRosaryIntentionsParams & { enabled?: boolean },
) => useQuery(getRosaryIntentionsQueryOptions(params));
