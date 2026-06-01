import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export type AddMembershipsInput = {
  /**
   * IDs des églises à rattacher. Le back marque la 1re comme appartenance
   * PRINCIPALE : l'appelant ordonne donc l'église principale en tête.
   */
  churchIds: number[];
};

/**
 * Cutover Chantier 7a (F1c) : remplace l'ancien PATCH scalaire
 * `primary_parish` par le batch d'appartenances `POST /me/memberships`
 * (multi-église). Le back complète l'onboarding dès qu'il existe ≥ 1 appartenance.
 */
export const useAddMemberships = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ churchIds }: AddMembershipsInput) =>
      api.post<unknown>('/v1/users/me/memberships/', { church_ids: churchIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      onSuccess?.();
    },
  });
};
