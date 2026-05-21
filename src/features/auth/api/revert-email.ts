import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

type RevertEmailInput = { token: string };

const revertEmailChange = (data: RevertEmailInput): Promise<unknown> =>
  api.post('/v1/users/email/change/revert/', data);

export const useRevertEmailChange = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) =>
  useMutation({
    mutationFn: revertEmailChange,
    onSuccess,
  });
