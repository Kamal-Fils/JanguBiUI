import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

/**
 * `date_proposed → confirmed` — le fidèle accepte la date que sa paroisse lui
 * propose. C'est la transition qui manquait : le statut `confirmed` existait
 * côté serveur mais aucune action n'y menait, si bien que la boucle
 * « proposition → accord » restait ouverte indéfiniment.
 *
 * ⚠️ Contrat : `src/types/api.ts` est GÉNÉRÉ (`yarn generate-api`) et ne
 * connaît pas encore cet endpoint — il ne contient que accept / celebrate /
 * decline / propose-date / my / parish / submit. On ne peut donc pas dériver
 * le type via `RequestBody<...>` comme le fait
 * `src/features/documents/api/admin-actions.ts`. Le fichier `api.ts` est
 * PARTAGÉ : il n'est volontairement PAS régénéré ici. À la prochaine
 * régénération, remplacer le commentaire ci-dessous par la dérivation typée.
 *
 * Contrat serveur (apps/mass_intentions/apis.py — MassIntentionConfirmDateApi) :
 *   POST /api/v1/mass-intentions/{intention_id}/confirm-date/
 *   corps : aucun · réponse 200 : MassIntentionOutputSerializer
 *   erreurs : 400 (statut invalide / pas de date), 404 (non visible)
 */
export const useConfirmIntentionDate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (intentionId: number) =>
      api.post<void>(`/v1/mass-intentions/${intentionId}/confirm-date/`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-intentions-my'] });
      queryClient.invalidateQueries({ queryKey: ['mass-intentions-parish'] });
    },
  });
};
