import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { Diocese } from '@/types/org';

const dioceseSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  // Le back (DioceseOutputSerializer) renvoie la FK sous la clé `province`
  // (+ `province_name`), pas `province_id`.
  province: z.number(),
  province_name: z.string().optional(),
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
