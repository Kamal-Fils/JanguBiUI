import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';

const notificationSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  payload: z.record(z.unknown()),
  is_read: z.boolean(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;

const parseNotifications = (data: unknown): Notification[] => {
  if (!Array.isArray(data)) return [];
  return data.map((item) => notificationSchema.parse(item));
};

export const getNotifications = (): Promise<Notification[]> =>
  api.get<unknown>('/v1/messaging/notifications/').then(parseNotifications);

export const useNotifications = () => {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 30_000,
    enabled: !!user?.id,
    retry: false,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      api.post<unknown>(`/v1/messaging/notifications/${notificationId}/read/`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
