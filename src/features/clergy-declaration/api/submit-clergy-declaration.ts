import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import {
  CLERGY_DECLARATION_QUERY_KEY,
  clergyDeclarationSchema,
  type ClergyClaimableRole,
  type ClergyDeclaration,
} from './get-my-clergy-declaration';

/**
 * Corps DÉRIVÉ du schéma OpenAPI, jamais écrit à la main : un champ mal nommé
 * devient une erreur de compilation et non une panne silencieuse en production.
 *
 * Le serializer côté serveur est volontairement nommé au niveau module
 * (`ClergyDeclarationCreateInputSerializer`) : imbriqué dans la vue, il aurait
 * produit un composant OpenAPI générique `Input` — déjà occupé par un tout autre
 * endpoint (`{ file_id }`) — et cette dérivation aurait typé la mauvaise forme.
 */
type SubmitClergyDeclarationBody = RequestBody<'v1_users_me_clergy_declaration_create'>;

export interface SubmitClergyDeclarationInput {
  claimedPastoralRole: ClergyClaimableRole;
  parishId: number;
  justificationFileId: number;
  message?: string;
}

export const submitClergyDeclaration = ({
  claimedPastoralRole,
  parishId,
  justificationFileId,
  message,
}: SubmitClergyDeclarationInput): Promise<ClergyDeclaration> =>
  api
    .post<unknown>('/v1/users/me/clergy-declaration/', {
      claimed_pastoral_role: claimedPastoralRole,
      parish_id: parishId,
      justification_file_id: justificationFileId,
      message: message ?? '',
    } satisfies SubmitClergyDeclarationBody)
    .then((data) => clergyDeclarationSchema.parse(data));

export const useSubmitClergyDeclaration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitClergyDeclaration,
    onSuccess: (declaration) => {
      // Le suivi devient la vue par défaut dès la soumission.
      queryClient.setQueryData(CLERGY_DECLARATION_QUERY_KEY, declaration);
      queryClient.invalidateQueries({ queryKey: CLERGY_DECLARATION_QUERY_KEY });
    },
  });
};
