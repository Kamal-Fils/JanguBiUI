'use client';

import { CalendarDays } from 'lucide-react';
import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvents } from '@/features/agenda/api/get-events';
import { EventCard } from '@/features/agenda/components/event-card';

const EVENT_TYPE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'mass', label: 'Messes' },
  { value: 'conference', label: 'Conférences' },
  { value: 'retreat', label: 'Retraites' },
  { value: 'ordination', label: 'Ordinations' },
  { value: 'other', label: 'Autres' },
];

export default function AgendaPage() {
  const [selectedType, setSelectedType] = useState('');
  const { data, isLoading, isError, refetch } = useEvents(
    selectedType ? { event_type: selectedType } : undefined,
  );

  useRegisterPageMeta({
    title: 'Agenda',
    subtitle: 'Événements et célébrations de votre paroisse',
  });

  const events = data?.results ?? [];

  return (
    <div className="flex flex-col">
      <ContentContainer>
        <SectionHeader
          eyebrow="Le calendrier"
          title="Prochains événements"
          description="Messes, retraites et rencontres de votre communauté."
        />

        <FilterPills
          options={EVENT_TYPE_FILTERS}
          value={selectedType}
          onChange={setSelectedType}
          ariaLabel="Filtrer par type d'événement"
          className="mb-6"
        />

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="elevated" className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </Card>
            ))}
          </div>
        )}

        {isError && (
          <ErrorState
            title="Impossible de charger l'agenda"
            description="Vérifiez votre connexion puis réessayez."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && events.length === 0 && (
          <EmptyState
            icon={<CalendarDays />}
            title={
              selectedType
                ? 'Aucun événement de ce type'
                : 'Aucun événement à venir'
            }
            description={
              selectedType
                ? 'Essayez un autre filtre pour découvrir les prochains rendez-vous de votre communauté.'
                : 'Les prochaines messes, retraites et rencontres de votre paroisse apparaîtront ici. Revenez bientôt !'
            }
            action={
              selectedType ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedType('')}
                >
                  Voir tous les événements
                </Button>
              ) : undefined
            }
          />
        )}

        {!isLoading && !isError && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </ContentContainer>
    </div>
  );
}
