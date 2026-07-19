import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const CLERGY_CLAIMABLE_ROLES = [
  'pretre',
  'diacre',
  'religieux',
  'eveque',
  'archeveque',
] as const;

export type ClergyClaimableRole = (typeof CLERGY_CLAIMABLE_ROLES)[number];

export const DECLARATION_STATUSES = ['pending', 'approved', 'rejected'] as const;

export const clergyDeclarationSchema = z.object({
  id: z.number(),
  claimed_pastoral_role: z.enum(CLERGY_CLAIMABLE_ROLES),
  status: z.enum(DECLARATION_STATUSES),
  parish_id: z.number(),
  parish_name: z.string().nullable(),
  message: z.string(),
  /** Motif du refus — vide tant que la demande n'a pas été refusée. */
  rejection_reason: z.string(),
  justification_file_url: z.string().nullable(),
  submitted_at: z.string().nullable(),
  reviewed_at: z.string().nullable(),
});

export type ClergyDeclaration = z.infer<typeof clergyDeclarationSchema>;

export const CLERGY_DECLARATION_QUERY_KEY = ['users', 'me', 'clergy-declaration'];

/**
 * Le serveur renvoie `null` tant qu'aucune demande n'a jamais été déposée : on
 * distingue « jamais demandé » (afficher le formulaire) de « demande en cours »
 * (afficher le suivi).
 */
const parseDeclaration = (data: unknown): ClergyDeclaration | null =>
  data == null ? null : clergyDeclarationSchema.parse(data);

export const getMyClergyDeclaration = (): Promise<ClergyDeclaration | null> =>
  api.get<unknown>('/v1/users/me/clergy-declaration/').then(parseDeclaration);

export const getMyClergyDeclarationQueryOptions = () =>
  queryOptions({
    queryKey: CLERGY_DECLARATION_QUERY_KEY,
    queryFn: getMyClergyDeclaration,
  });

export const useMyClergyDeclaration = () =>
  useQuery(getMyClergyDeclarationQueryOptions());
