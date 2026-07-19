'use client';

import { CalendarDays } from 'lucide-react';
import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvents, type Event } from '@/features/agenda/api/get-events';
import { EventCard } from '@/features/agenda/components/event-card';

const EVENT_TYPE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'mass', label: 'Messes' },
  { value: 'conference', label: 'Conférences' },
  { value: 'retreat', label: 'Retraites' },
  { value: 'ordination', label: 'Ordinations' },
  { value: 'other', label: 'Autres' },
];

/**
 * Nombre de bandes après la une avant de basculer en brèves. Au-delà, le fil
 * redeviendrait une répétition — c'est le point où le tempo doit changer.
 * Même seuil que le fil actualités, pour que les deux flux se lisent pareil.
 */
const BAND_COUNT = 3;

function AgendaSkeleton() {
  // Miroir du rythme réel : une une haute → bandes → brèves. Un squelette
  // uniforme annoncerait une pile uniforme et produirait un saut à l'arrivée
  // des données.
  return (
    <div className="flex flex-col">
      <Skeleton className="h-56 w-full rounded-2xl" />
      <div className="mt-7 flex flex-col gap-4">
        {Array.from({ length: BAND_COUNT }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Le fil agenda se lit en **trois mouvements**, pas en pile uniforme :
 *
 * 1. **Le prochain rendez-vous** — bloc date en grande échelle, titre
 *    `text-headline`, description complète, inscription pleine largeur. C'est
 *    l'événement sur lequel on décide vraiment (R1, R2).
 * 2. **Les suivants** — jusqu'à trois bandes pleine largeur, denses,
 *    l'inscription toujours à portée.
 * 3. **Plus tard** — le reste en brèves d'une ligne, sans inscription : on
 *    passe par le détail pour s'engager sur une date lointaine.
 *
 * L'échelle et la densité décroissent d'un mouvement à l'autre. Pour un agenda,
 * ce dégradé n'est pas décoratif : **la proximité dans le temps est
 * l'importance**, et une pile de cartes identiques ne pouvait pas le dire.
 */
function AgendaRhythm({ events }: { events: Event[] }) {
  const [next, ...others] = events;
  const bands = others.slice(0, BAND_COUNT);
  const briefs = others.slice(BAND_COUNT);

  return (
    <div className="flex flex-col">
      {next && <EventCard event={next} variant="lead" />}

      {bands.length > 0 && (
        <section className="mt-7" aria-labelledby="agenda-bands-heading">
          <h2
            id="agenda-bands-heading"
            className="font-serif text-lg font-bold tracking-tight text-foreground"
          >
            Puis
          </h2>
          <div className="mt-3 flex flex-col gap-4">
            {bands.map((event) => (
              <EventCard key={event.id} event={event} variant="band" />
            ))}
          </div>
        </section>
      )}

      {briefs.length > 0 && (
        <section className="mt-9" aria-labelledby="agenda-briefs-heading">
          <h2
            id="agenda-briefs-heading"
            className="font-serif text-lg font-bold tracking-tight text-foreground"
          >
            Plus tard
          </h2>
          <ul className="mt-2 divide-y divide-border border-t border-border">
            {briefs.map((event) => (
              <li key={event.id}>
                <EventCard event={event} variant="brief" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

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

        {isLoading && <AgendaSkeleton />}

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
          <AgendaRhythm events={events} />
        )}
      </ContentContainer>
    </div>
  );
}
