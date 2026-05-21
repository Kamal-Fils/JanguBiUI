import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Minister } from '@/features/allo-pretre/api/get-ministers';
import { api } from '@/lib/api-client';

export type CreateMinisterInput = {
  first_name: string;
  last_name: string;
  role: 'PRIEST' | 'SISTER' | 'DEACON' | 'RELIGIOUS' | 'BISHOP';
  parish_id: number;
  bio?: string;
  is_active?: boolean;
  photo?: File;
};

export type UpdateMinisterInput = Partial<CreateMinisterInput>;

// Serialize object to FormData to support file uploads
const toFormData = (data: CreateMinisterInput | UpdateMinisterInput) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Append files directly, otherwise convert to string
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });
  return formData;
};

export const createMinister = async (
  data: CreateMinisterInput,
): Promise<Minister> => {
  const formData = toFormData(data);
  return api.post<Minister>('/v1/availability/ministers/', formData);
};

export const updateMinister = async (
  slug: string,
  data: UpdateMinisterInput,
): Promise<Minister> => {
  const formData = toFormData(data);
  return api.patch<Minister>(`/v1/availability/ministers/${slug}/`, formData);
};

export const useCreateMinister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMinister,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministers'] });
    },
  });
};

export const useUpdateMinister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateMinisterInput }) =>
      updateMinister(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministers'] });
    },
  });
};
