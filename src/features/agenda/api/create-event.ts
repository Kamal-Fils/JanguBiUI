import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { Event, eventSchema } from './get-events';

export type CreateEventInput = {
  title: string;
  description: string;
  event_type: string;
  start_at: string;
  end_at: string;
  location: string;
  max_participants?: number | null;
};

export const useCreateEvent = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventInput): Promise<Event> =>
      api
        .post<unknown>('/v1/agenda/events/', data)
        .then((res) => eventSchema.parse(res)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onSuccess?.();
    },
  });
};
