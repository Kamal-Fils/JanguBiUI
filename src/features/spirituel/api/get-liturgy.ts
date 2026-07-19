import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const LITURGY_BASE = '/v1/liturgy/v1';

/**
 * Jour liturgique courant — temps de l'Église et nom du jour.
 *
 * Tous les champs sont tolérants : l'AELF ne renseigne pas toujours `season`
 * ni `day_name`, et une absence de libellé ne doit jamais faire échouer la
 * page entière. La couleur du temps se déduit ensuite de `season`
 * (`getLiturgicalTone`), qui retombe sur le vert du temps ordinaire.
 */
const liturgicalInfoSchema = z
  .object({
    id: z.number().optional(),
    date: z.string().nullish(),
    zone: z.string().nullish(),
    day_name: z.string().nullish(),
    season: z.string().nullish(),
  })
  .passthrough();

export type LiturgicalInfo = z.infer<typeof liturgicalInfoSchema>;

/** Une lecture de la messe — contrat `Reading` de drf-spectacular. */
const readingSchema = z
  .object({
    id: z.number(),
    type: z.string().nullish(),
    citation: z.string().nullish(),
    text: z.string().nullish(),
  })
  .passthrough();

export type Reading = z.infer<typeof readingSchema>;

export const getLiturgicalInfo = (): Promise<LiturgicalInfo> =>
  api
    .get<unknown>(`${LITURGY_BASE}/informations/`)
    .then((data) => liturgicalInfoSchema.parse(data));

export const getLiturgicalInfoQueryOptions = () =>
  queryOptions({
    queryKey: ['liturgy', 'info'],
    queryFn: getLiturgicalInfo,
    retry: false,
  });

export const useLiturgicalInfo = () =>
  useQuery(getLiturgicalInfoQueryOptions());

export const getMassReadings = (): Promise<Reading[]> =>
  api
    .get<unknown>(`${LITURGY_BASE}/messes/`)
    .then((data) => z.array(readingSchema).parse(data));

export const getMassReadingsQueryOptions = () =>
  queryOptions({
    queryKey: ['liturgy', 'messes'],
    queryFn: getMassReadings,
    retry: false,
  });

export const useMassReadings = () => useQuery(getMassReadingsQueryOptions());
