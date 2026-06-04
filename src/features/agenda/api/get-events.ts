import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  event_type: z.string(),
  start_at: z.string(),
  end_at: z.string(),
  location: z.string(),
  scope_type: z.string(),
  scope_id: z.number().nullable().optional(),
  max_participants: z.number().nullable().optional(),
  organizer_email: z.string().email().nullable().optional(),
  registration_count: z.number(),
  is_registered: z.boolean().optional(),
  created_at: z.string(),
});

export type Event = z.infer<typeof eventSchema>;

const eventsResponseSchema = z.object({
  count: z.number(),
  results: z.array(eventSchema),
});

type EventsResponse = z.infer<typeof eventsResponseSchema>;

// Le fil agenda est AGRÉGÉ côté back (event_list_for_user, C3b) : plus de filtre de
// portée « ma paroisse ». Seul le type d'événement reste filtrable.
type EventsParams = {
  event_type?: string;
};

export const getEvents = (params?: EventsParams): Promise<EventsResponse> => {
  const query = new URLSearchParams();
  if (params?.event_type) query.set('event_type', params.event_type);
  const qs = query.toString();
  return api
    .get<unknown>(`/v1/agenda/events/${qs ? `?${qs}` : ''}`)
    .then((data) => eventsResponseSchema.parse(data));
};

export const getEventsQueryOptions = (params?: EventsParams, enabled = true) =>
  queryOptions({
    queryKey: ['events', params],
    queryFn: () => getEvents(params),
    enabled,
  });

export const useEvents = (params?: EventsParams, enabled = true) =>
  useQuery(getEventsQueryOptions(params, enabled));
