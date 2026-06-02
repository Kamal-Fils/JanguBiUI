// LOT2-001 (code mort) : `Parish` (schéma availability) n'existe plus dans
// api.ts depuis que C6 a régénéré le schéma sans /v1/availability. Erreur
// check-types tolérée et documentée — voir docs/known-issues.md.
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { components } from '@/types/api';

export type Parish = components['schemas']['Parish'];

// Slug is excluded from input type
export type CreateParishInput = Omit<Parish, 'id' | 'slug'>;
export type UpdateParishInput = Partial<CreateParishInput>;

export const createParish = (data: CreateParishInput): Promise<Parish> => {
  return api.post('/v1/availability/parishes/', data);
};

export const updateParish = (
  slug: string,
  data: UpdateParishInput,
): Promise<Parish> => {
  return api.patch(`/v1/availability/parishes/${slug}/`, data);
};

export const useCreateParish = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createParish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parishes'] });
    },
  });
};

export const useUpdateParish = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateParishInput }) =>
      updateParish(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parishes'] });
    },
  });
};
