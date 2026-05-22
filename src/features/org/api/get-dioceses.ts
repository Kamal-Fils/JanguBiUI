import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { Diocese } from '@/types/org';

const dioceseSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  province_id: z.number(),
});

const diocesesResponseSchema = z.object({
  results: z.array(dioceseSchema),
});

export const getDioceses = (provinceId?: number): Promise<Diocese[]> => {
  const params = provinceId ? `?province=${provinceId}` : '';
  return api
    .get<unknown>(`/v1/org/dioceses/${params}`)
    .then((data) => diocesesResponseSchema.parse(data).results);
};

export const getDiocesesQueryOptions = (provinceId?: number) =>
  queryOptions({
    queryKey: ['org', 'dioceses', provinceId],
    queryFn: () => getDioceses(provinceId),
    retry: false,
  });

export const useDioceses = (provinceId?: number) =>
  useQuery(getDiocesesQueryOptions(provinceId));
