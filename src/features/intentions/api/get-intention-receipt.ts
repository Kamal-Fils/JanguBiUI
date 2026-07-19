import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { components } from '@/types/api';
import type { Expect, Matches } from '@/types/api-contract';

/** Forme réellement renvoyée par le serveur (schéma OpenAPI généré). */
type ContractReceipt = components['schemas']['MassIntentionReceiptOutput'];

/**
 * Reçu numérique d'une intention célébrée — la trace que le fidèle est venu
 * chercher (intention, date, célébrant, paroisse, référence).
 *
 * `GET /api/v1/mass-intentions/{intention_id}/receipt/`
 *   → 400 si l'intention n'est pas encore célébrée · 404 si non visible
 *
 * `useMutation` plutôt que `useQuery` : le reçu n'est pas une donnée d'écran,
 * c'est le résultat d'une action explicite du fidèle (« télécharger »). Rien
 * ne doit partir tant qu'il n'a pas cliqué.
 */
export const intentionReceiptSchema = z.object({
  reference: z.string(),
  receipt_url: z.string().nullable(),
  celebration_date: z.string().nullable(),
});

export type IntentionReceipt = z.infer<typeof intentionReceiptSchema>;

/**
 * Garde de compilation : le schéma zod ci-dessus valide la réponse à
 * l'exécution (c'est bien lui qui doit rester), mais rien ne garantissait
 * qu'il décrive la MÊME forme que le serveur. La vérification est désormais
 * faite par le compilateur, dans les deux sens : un champ ajouté, retiré ou
 * renommé côté serveur casse le build au lieu de casser un écran en production.
 */
type _ReceiptMatchesContract = Expect<Matches<IntentionReceipt, ContractReceipt>>;

export const getIntentionReceipt = (
  intentionId: number,
): Promise<IntentionReceipt> =>
  api
    .get<unknown>(`/v1/mass-intentions/${intentionId}/receipt/`)
    .then((data) => intentionReceiptSchema.parse(data));

export const useIntentionReceipt = () =>
  useMutation({ mutationFn: getIntentionReceipt });
