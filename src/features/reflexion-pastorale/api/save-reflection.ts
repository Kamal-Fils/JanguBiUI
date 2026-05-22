import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { PastoralReflection, pastoralReflectionSchema } from '../types';

export type SaveReflectionInput = { content: string; existingId?: number };

const saveReflection = ({ content, existingId }: SaveReflectionInput): Promise<PastoralReflection> => {
  const payload = { content };
  const request = existingId
    ? api.patch<unknown>(`/v1/spiritual/reflections/${existingId}/`, payload)
    : api.post<unknown>('/v1/spiritual/reflections/', payload);
  return request.then((res) => pastoralReflectionSchema.parse(res));
};

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
