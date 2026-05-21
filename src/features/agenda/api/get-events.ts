import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const eventSchema = z.object({
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
  created_at: z.string(),
});

export type Event = z.infer<typeof eventSchema>;

type EventsResponse = { count: number; results: Event[] };

const parseEvents = (data: unknown): EventsResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => eventSchema.parse(item)),
  };
};

export const getEvents = (params?: {
  scope_type?: string;
  event_type?: string;
}): Promise<EventsResponse> => {
  const query = new URLSearchParams();
  if (params?.scope_type) query.set('scope_type', params.scope_type);
  if (params?.event_type) query.set('event_type', params.event_type);
  const qs = query.toString();
  return api
    .get<unknown>(`/v1/agenda/events/${qs ? `?${qs}` : ''}`)
    .then(parseEvents);
};

export const getEventsQueryOptions = (params?: {
  scope_type?: string;
  event_type?: string;
}) =>
  queryOptions({
    queryKey: ['events', params],
    queryFn: () => getEvents(params),
  });

export const useEvents = (params?: {
  scope_type?: string;
  event_type?: string;
}) => useQuery(getEventsQueryOptions(params));
