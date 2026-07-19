import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { documentStatusSchema } from '../types';

/**
 * Comptages par statut sur le périmètre d'autorité de l'agent. Le serveur
 * renvoie toujours les six statuts (à 0 le cas échéant) et applique les mêmes
 * filtres que la liste, à l'exception de `status` — qui mettrait sinon tous les
 * autres statuts à zéro.
 */
const countsSchema = z.object({
  counts: z.record(documentStatusSchema, z.number()),
  total: z.number(),
});

export type AdminDocumentCounts = z.infer<typeof countsSchema>;

/** Mêmes filtres que la liste, sans `status` (volontairement ignoré côté API). */
export type AdminDocumentCountsParams = {
  document_type?: string;
  parish_name?: string;
  search?: string;
  assigned_to_id?: number;
};

export const getAdminDocumentCounts = (
  params?: AdminDocumentCountsParams,
): Promise<AdminDocumentCounts> =>
  api
    .get<unknown>('/v1/documents/admin/requests/counts/', { params })
    .then((data) => countsSchema.parse(data));

export const getAdminDocumentCountsQueryOptions = (
  params?: AdminDocumentCountsParams,
) =>
  queryOptions({
    queryKey: ['documents', 'admin', 'counts', params],
    queryFn: () => getAdminDocumentCounts(params),
    // Le backend peut ne pas encore exposer l'endpoint : on n'insiste pas,
    // l'UI retombe sur un affichage sans chiffres.
    retry: false,
  });

export const useAdminDocumentCounts = (params?: AdminDocumentCountsParams) =>
  useQuery(getAdminDocumentCountsQueryOptions(params));
