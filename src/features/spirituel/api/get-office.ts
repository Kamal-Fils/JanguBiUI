import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const hymnSchema = z.object({
  text: z.string(),
  type: z.string().optional(),
});

const psalmSchema = z.object({
  id: z.number().optional(),
  citation: z.string().optional(),
  title: z.string().optional(),
  text: z.string(),
});

const intercessionSchema = z.object({
  text: z.string(),
});

export const officeSchema = z.object({
  id: z.number(),
  office_type: z.string(),
  date: z.string().optional(),
  hymns: z.array(hymnSchema).optional(),
  psalms: z.array(psalmSchema).optional(),
  intercessions: z.array(intercessionSchema).optional(),
  intro: z.string().optional(),
  conclusion: z.string().optional(),
});

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

export const useOffice = (officeKey: OfficeKey, date?: string) =>
  useQuery(getOfficeQueryOptions(officeKey, date));
