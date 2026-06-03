import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import type { AdminUser, AdminUsersResponse } from './get-admin-users';

type ToggleContext = {
  previous: [readonly unknown[], AdminUsersResponse | undefined][];
};

export const useToggleUserActive = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string, ToggleContext>({
    mutationFn: (userId: string) =>
      api.post<void>(`/v1/users/${userId}/toggle-active/`, {}),
    // Update optimiste : bascule `is_active` dans toutes les pages déjà en cache.
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ['admin-users'] });
      const previous = queryClient.getQueriesData<AdminUsersResponse>({
        queryKey: ['admin-users'],
      });
      previous.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<AdminUsersResponse>(key, {
          ...data,
          results: data.results.map((u: AdminUser) =>
            u.id === userId ? { ...u, is_active: !u.is_active } : u,
          ),
        });
      });
      return { previous };
    },
    onError: (_err, _userId, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};
