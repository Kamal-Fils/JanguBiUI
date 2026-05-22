import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { TransferRequest, transferRequestSchema } from '../types';

export type CreateTransferInput = {
  destination_parish_id: number;
  reason?: string;
};

export const useCreateTransfer = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransferInput): Promise<TransferRequest> =>
      api
        .post<unknown>('/v1/transfers/', data)
        .then((res) => transferRequestSchema.parse(res)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      onSuccess?.();
    },
  });
};
