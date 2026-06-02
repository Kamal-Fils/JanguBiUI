// LOT2-001 (code mort) : `ServiceType` n'existe plus dans api.ts depuis que C6
// a régénéré le schéma sans /v1/availability. Erreur check-types tolérée et
// documentée — voir docs/known-issues.md.
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { components } from '@/types/api';

export type ServiceType = components['schemas']['ServiceType'];

// Slug is excluded from input type
export type CreateServiceInput = Omit<ServiceType, 'id' | 'slug'>;
export type UpdateServiceInput = Partial<CreateServiceInput>;

export const createService = (
  data: CreateServiceInput,
): Promise<ServiceType> => {
  return api.post('/v1/availability/services/', data);
};

export const updateService = (
  slug: string,
  data: UpdateServiceInput,
): Promise<ServiceType> => {
  return api.patch(`/v1/availability/services/${slug}/`, data);
};

export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateServiceInput }) =>
      updateService(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};
