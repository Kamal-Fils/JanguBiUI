import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { components } from '@/types/api';

export type RosaryGroup = components['schemas']['Group'];

export const getRosaryGroups = async (): Promise<RosaryGroup[]> => {
  const res = (await api.get<{ results: RosaryGroup[] } | RosaryGroup[]>(
    '/v1/rosary/groups/',
  )) as { results: RosaryGroup[] } | RosaryGroup[];
  return Array.isArray(res) ? res : res.results;
};

export const getRosaryGroupsQueryOptions = () => {
  return queryOptions({
    queryKey: ['rosary', 'groups'],
    queryFn: getRosaryGroups,
  });
};

export const useRosaryGroups = () => useQuery(getRosaryGroupsQueryOptions());
