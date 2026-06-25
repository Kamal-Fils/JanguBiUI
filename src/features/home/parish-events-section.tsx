'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useEvents } from '@/features/agenda/api/get-events';
import { EventCard } from '@/features/agenda/components/event-card';

export function ParishEventsSection() {
  const { data, isLoading } = useEvents();

  const upcomingEvents = (data?.results ?? [])
    .filter((e) => new Date(e.start_at) >= new Date())
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && upcomingEvents.length === 0 && (
        <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          Aucun événement prévu prochainement.
        </p>
      )}

      {!isLoading && upcomingEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
