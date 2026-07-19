import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { ResponseBody } from '@/types/api-contract';

/**
 * Référentiel du formulaire de demande de document.
 *
 * La règle « quel motif pour quel type » est une règle métier ECCLÉSIALE tenue
 * côté serveur (`apps/documents/constants.py`) : le backend la fait respecter à
 * la création. Le front la **consomme** au lieu de la redéclarer — une copie en
 * dur finirait par diverger de la règle réellement appliquée.
 */

const documentTypeOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  /** Vrai pour « Autre document » : `document_type_free` devient obligatoire. */
  requires_precision: z.boolean(),
  /** Valeurs de `reason` recevables avec ce type de document. */
  allowed_reasons: z.array(z.string()),
});

const reasonOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const documentOptionsSchema = z.object({
  document_types: z.array(documentTypeOptionSchema),
  reasons: z.array(reasonOptionSchema),
});

export type DocumentTypeOption = z.infer<typeof documentTypeOptionSchema>;
export type ReasonOption = z.infer<typeof reasonOptionSchema>;
export type DocumentOptions = z.infer<typeof documentOptionsSchema>;

/**
 * Garde-fou de compilation : le schéma zod ci-dessus doit rester assignable au
 * contrat OpenAPI généré. Si le backend renomme un champ, le build casse ici
 * plutôt qu'au runtime dans le formulaire.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- assertion de type : son seul rôle est d'échouer à la compilation si le contrat serveur change.
type _ContractCheck = DocumentOptions extends ResponseBody<'v1_documents_requests_options_retrieve'>
  ? true
  : never;

export const getDocumentOptions = (): Promise<DocumentOptions> =>
  api
    .get<unknown>('/v1/documents/requests/options/')
    .then((res) => documentOptionsSchema.parse(res));

export const getDocumentOptionsQueryOptions = () =>
  queryOptions({
    queryKey: ['documents', 'options'],
    queryFn: getDocumentOptions,
    // Référentiel quasi statique : inutile de le rejouer à chaque montage du
    // formulaire (le tunnel revient à l'étape 1 à chaque « Précédent »).
    staleTime: 5 * 60 * 1000,
  });

export const useDocumentOptions = () => useQuery(getDocumentOptionsQueryOptions());
