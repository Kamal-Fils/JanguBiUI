import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { lectioDivinaSchema } from './get-lectio-sessions';
import type { LectioDivinaSession } from './get-lectio-sessions';

// Re-export schema for use in this module
export { lectioDivinaSchema };

export type SaveLectioInput = {
  /**
   * Verset médité, ou `null` (ou champ omis) pour une Lectio « du jour » qui ne
   * se rattache à aucun passage précis.
   *
   * Le client envoyait `0` faute de forme prévue côté serveur, ce qui produisait
   * un 400 « Verset introuvable » à CHAQUE sauvegarde depuis la lecture du jour :
   * quatre étapes de méditation perdues. Le serveur accepte désormais `null` —
   * et tolère encore `0` par compatibilité — mais `null` est la forme canonique.
   */
  passage_id?: number | null;
  lectio?: string;
  meditatio?: string;
  oratio?: string;
  contemplatio?: string;
};

export const useSaveLectioSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveLectioInput): Promise<LectioDivinaSession> =>
      api
        .post<unknown>('/v1/bible/lectio/', data)
        .then((res) => lectioDivinaSchema.parse(res)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectio-sessions'] });
    },
  });
};
