import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/**
 * Un office de la Liturgie des Heures.
 *
 * Le schéma est délibérément **tolérant** : le contrat OpenAPI type `psalms`
 * et `readings` en `unknown`, et le backend livre ces clés tantôt en chaîne
 * HTML, tantôt en liste d'objets. Une version antérieure les déclarait en
 * `z.array(...)` stricts : dès que l'AELF renvoyait une chaîne, `parse()`
 * levait et l'office entier affichait « Impossible de charger cet office ».
 * La mise en forme est déléguée à `toOfficeSections`, qui absorbe les formes.
 */
export const officeSchema = z
  .object({
    id: z.number(),
    office_type: z.string(),
    date: z.string().nullish(),
  })
  .passthrough();

export type Office = z.infer<typeof officeSchema>;

export type OfficeKey =
  | 'laudes'
  | 'tierce'
  | 'sexte'
  | 'none'
  | 'vepres'
  | 'complies'
  | 'lectures';

export const getOffice = (
  officeKey: OfficeKey,
  date?: string,
): Promise<Office> =>
  api
    .get<unknown>(`/v1/liturgy/v1/${officeKey}/${date ? `?date=${date}` : ''}`)
    .then((data) => officeSchema.parse(data));

export const getOfficeQueryOptions = (officeKey: OfficeKey, date?: string) =>
  queryOptions({
    queryKey: ['liturgy', 'office', officeKey, date],
    queryFn: () => getOffice(officeKey, date),
    retry: false,
  });

interface UseOfficeOptions {
  date?: string;
  /**
   * Les offices sont réservés au clergé et aux religieux côté backend
   * (`CanAccessLiturgyOfHours`). Laisser un fidèle déclencher la requête
   * affiche un toast 403 à chaque visite : on passe `enabled: false`.
   */
  enabled?: boolean;
}

export const useOffice = (
  officeKey: OfficeKey,
  { date, enabled = true }: UseOfficeOptions = {},
) =>
  useQuery({
    ...getOfficeQueryOptions(officeKey, date),
    enabled,
  });
