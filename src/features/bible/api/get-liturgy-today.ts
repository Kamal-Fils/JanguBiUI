import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { components } from '@/types/api';

export type LiturgicalDate = components['schemas']['LiturgicalDate'];
export type LiturgyReading = components['schemas']['Reading'];
export type LiturgyOffice = components['schemas']['Office'];

// We cast readings and offices since OpenAPI incorrectly types them as string
// when they likely return arrays of objects or URLs.
export interface LiturgicalTodayResponse
  extends Omit<LiturgicalDate, 'readings' | 'offices'> {
  readings: LiturgyReading[];
  offices: LiturgyOffice[];
}

export async function fetchLiturgyToday(): Promise<LiturgicalTodayResponse> {
  return api.get('/v1/liturgy/today/');
}

export async function fetchLiturgyForDate(
  dateStr: string,
): Promise<LiturgicalTodayResponse> {
  return api.get(`/v1/liturgy/date/${dateStr}/`);
}

export const getLiturgyQueryOptions = (date?: Date) => {
  const today = new Date();
  const isToday = !date || date.toDateString() === today.toDateString();

  if (isToday) {
    return queryOptions({
      queryKey: ['liturgy', 'today'],
      queryFn: fetchLiturgyToday,
    });
  }

  const dateStr = date.toISOString().split('T')[0];
  return queryOptions({
    queryKey: ['liturgy', 'date', dateStr],
    queryFn: () => fetchLiturgyForDate(dateStr),
  });
};

export function useLiturgyToday(date?: Date) {
  return useQuery(getLiturgyQueryOptions(date));
}
