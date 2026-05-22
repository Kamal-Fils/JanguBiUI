import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { PastoralReflection, pastoralReflectionSchema } from '../types';

export type SaveReflectionInput = { content: string };

export const saveReflection = (data: SaveReflectionInput): Promise<PastoralReflection> =>
  api
    .post<unknown>('/v1/spiritual/reflections/', data)
    .then((res) => pastoralReflectionSchema.parse(res));

export const useSaveReflection = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveReflection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflexion-pastorale'] });
      onSuccess?.();
    },
  });
};
