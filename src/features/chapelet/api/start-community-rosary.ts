import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { communityRosarySchema } from './get-community-rosaries';
import type { CommunityRosary } from './get-community-rosaries';

export { communityRosarySchema };

export type StartRosaryInput = {
  intention?: string;
  mystery_group_id?: number | null;
};

export const useStartCommunityRosary = ({
  onSuccess,
}: { onSuccess?: (r: CommunityRosary) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartRosaryInput): Promise<CommunityRosary> =>
      api
        .post<unknown>('/v1/rosary/community/', data)
        .then((res) => communityRosarySchema.parse(res)),
    onSuccess: (rosary) => {
      queryClient.invalidateQueries({ queryKey: ['community-rosaries'] });
      onSuccess?.(rosary);
    },
  });
};
