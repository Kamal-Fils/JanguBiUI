import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export interface MakeDonationInput {
  campaign_id?: number | null;
  // Bénéficiaire : église du donateur (memberships). parish_id dérivé côté front.
  church_id?: number | null;
  parish_id?: number | null;
  amount: number;
  payment_provider: string;
  is_anonymous?: boolean;
  note?: string;
}

export const useMakeDonation = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MakeDonationInput) =>
      api.post<void>('/v1/donations/donate/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donation-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      onSuccess?.();
    },
  });
};
