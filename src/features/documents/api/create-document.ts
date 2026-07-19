import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { DocumentRequest, documentRequestSchema } from '../types';

type CreateBody = RequestBody<'v1_documents_requests_create'>;

export type CreateDocumentInput = {
  document_type: string;
  /** Obligatoire quand `document_type === 'other'` (libellé réel du document). */
  document_type_free?: string;
  reason: string;
  /** Obligatoire quand `reason === 'other'`. */
  reason_free?: string;
  // Identité
  requester_last_name: string;
  requester_first_names: string;
  date_of_birth: string;
  place_of_birth: string;
  // Contact
  contact_phone: string;
  contact_email: string;
  // Recherche
  registered_last_name?: string;
  registered_first_names?: string;
  father_last_name: string;
  mother_last_name: string;
  // Paroisse du registre : FK choisie via le picker (B5c). Le back exige parish_id
  // et dérive nom + diocèse depuis la FK. parish_name/diocese ne sont plus envoyés.
  parish_id: number;
  sacrament_approximate_date: string;
  sacrament_location: string;
  additional_info?: string;
  document_details?: Record<string, string>;
  consent_given: boolean;
  attachment_file_id?: number | null;
};

/**
 * Garde-fou de compilation : chaque champ envoyé doit exister dans le contrat
 * OpenAPI du serveur. C'est exactement le mode de panne déjà rencontré ici —
 * un champ mal nommé que DRF ignore en silence (`message` pour `comment`).
 *
 * On vérifie les **noms** plutôt que de dériver le type entier : drf-spectacular
 * marque les champs à valeur par défaut comme requis et les choices comme unions
 * de littéraux, ce que ce type volontairement plus souple n'imite pas.
 */
/* eslint-disable @typescript-eslint/no-unused-vars -- assertions de type : leur
   seul rôle est d'échouer à la compilation si le contrat serveur change. */
type _CreateFieldsExistInContract =
  keyof CreateDocumentInput extends keyof CreateBody ? true : never;
type _PrecisionFieldsMatchContract = CreateDocumentInput['document_type_free'] extends
  | CreateBody['document_type_free']
  | undefined
  ? true
  : never;
/* eslint-enable @typescript-eslint/no-unused-vars */

export const createDocumentRequest = (
  data: CreateDocumentInput,
): Promise<DocumentRequest> =>
  api
    .post<unknown>('/v1/documents/requests/', data)
    .then((res) => documentRequestSchema.parse(res));

export const useCreateDocument = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDocumentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'requests'] });
      onSuccess?.();
    },
  });
};
