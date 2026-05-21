import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import type { ServiceType } from './mutations-service';

export const getServices = async (): Promise<ServiceType[]> => {
  const res = (await api.get<{ results: ServiceType[] } | ServiceType[]>(
    '/v1/availability/services/',
  )) as { results: ServiceType[] } | ServiceType[];
  return Array.isArray(res) ? res : res.results;
};

export const getServicesQueryOptions = () =>
  queryOptions({ queryKey: ['services'], queryFn: getServices });

export const useServices = () => useQuery(getServicesQueryOptions());
