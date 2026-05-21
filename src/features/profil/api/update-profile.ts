import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export type UpdateProfileInput = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  title?: string;
  date_of_birth?: string;
};

export type ChangePasswordInput = {
  current_password: string;
  new_password: string;
};

export const useUpdateProfile = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      api.patch<unknown>('/v1/users/me/update/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      onSuccess?.();
    },
  });
};

export const useChangePassword = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) =>
  useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      api.post<unknown>('/v1/users/password/change/', data),
    onSuccess,
  });
