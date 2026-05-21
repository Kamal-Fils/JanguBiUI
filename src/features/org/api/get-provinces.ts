import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { Province } from '@/types/org';

const provinceSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  country: z.string(),
});

const provincesResponseSchema = z.object({
  results: z.array(provinceSchema),
});

export const getProvinces = (): Promise<Province[]> =>
  api
    .get<unknown>('/v1/org/provinces/')
    .then((data) => provincesResponseSchema.parse(data).results);

export const getProvincesQueryOptions = () =>
  queryOptions({ queryKey: ['org', 'provinces'], queryFn: getProvinces });

export const useProvinces = () => useQuery(getProvincesQueryOptions());
