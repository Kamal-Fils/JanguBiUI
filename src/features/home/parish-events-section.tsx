'use client';

import { CalendarDays } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvents } from '@/features/agenda/api/get-events';
import { EventCard } from '@/features/agenda/components/event-card';

/** Nombre d'événements montrés sur l'accueil ; l'agenda complet est à un tap. */
const HOME_EVENTS_COUNT = 3;

export function ParishEventsSection() {
  // La troncature est demandée AU SERVEUR : l'accueil ne rapatrie que ce qu'il
  // affiche. Le back ne renvoie déjà que les événements à venir, triés par date
  // (`event_list_for_user`, `upcoming_only=True`) — rien à re-filtrer ici.
  const { data, isLoading, isError, refetch } = useEvents({
    limit: HOME_EVENTS_COUNT,
  });

  const upcomingEvents = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Sans cet état, une panne réseau se lisait « aucun événement prévu ».
  if (isError) {
    return (
      <ErrorState
        title="Agenda indisponible"
        description="Les prochains événements n’ont pas pu être chargés."
        onRetry={() => void refetch()}
        className="py-8"
      />
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays />}
        title="Aucun événement à venir"
        description="Les rendez-vous de votre paroisse s’afficheront ici."
        className="py-8"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {upcomingEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
