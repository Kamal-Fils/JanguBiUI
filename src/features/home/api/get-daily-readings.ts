import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';

// .passthrough() PARTOUT : ce hook partage la queryKey ['liturgy','today'] avec
// l'onglet « Aujourd'hui » de la Bible (cache commun, un seul appel réseau).
// Un parse strict strip-erait les champs riches (text, matched_verses…) dont la
// Bible a besoin quand c'est le dashboard qui remplit le cache en premier.
const readingSchema = z
  .object({
    // Le backend envoie un id numérique ; on tolère une string pour rester
    // robuste (fixtures/mocks, futur uuid).
    id: z.union([z.number(), z.string()]),
    type: z.string().nullable().optional(),
    citation: z.string().nullable().optional(),
  })
  .passthrough();

const liturgyTodaySchema = z
  .object({
    date: z.string().optional(),
    season: z.string().nullable().optional(),
    day_name: z.string().nullable().optional(),
    readings: z.array(readingSchema).default([]),
  })
  .passthrough();

export type DailyReadings = z.infer<typeof liturgyTodaySchema>;

export const getDailyReadings = (): Promise<DailyReadings> =>
  api
    .get<unknown>('/v1/liturgy/today/')
    .then((d) => liturgyTodaySchema.parse(d));

/**
 * Lectures du jour pour le dashboard fidèle — remplace les références
 * codées en dur (Isaïe 55…) qui divergeaient de la vraie page de lecture
 * (retour testeurs n°1). Hook local à la feature home : pas d'import
 * cross-feature depuis features/bible.
 */
export const useDailyReadings = () => {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['liturgy', 'today'],
    queryFn: getDailyReadings,
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    retry: false,
  });
};
