'use client';

import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardEyebrow,
  CardTitle,
} from '@/components/ui/card/card';
import { FilterPills } from '@/components/ui/filter-pills';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvents } from '@/features/agenda/api/get-events';
import { EventCard } from '@/features/agenda/components/event-card';
import { EventForm } from '@/features/agenda/components/event-form';
import { useUser } from '@/lib/auth';
import { isAdmin, isClergy } from '@/lib/authorization';

const EVENT_TYPE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'mass', label: 'Messes' },
  { value: 'conference', label: 'Conférences' },
  { value: 'retreat', label: 'Retraites' },
  { value: 'ordination', label: 'Ordinations' },
  { value: 'other', label: 'Autres' },
];

const canManageAgenda = (user: Parameters<typeof isAdmin>[0]) =>
  isClergy(user) || isAdmin(user);

export default function AdminAgendaPage() {
  const { data: user } = useUser();
  const [selectedType, setSelectedType] = useState('');
  const [showForm, setShowForm] = useState(false);

  const canManage = canManageAgenda(user);
  const { data, isLoading: eventsLoading } = useEvents(
    selectedType ? { event_type: selectedType } : undefined,
    canManage,
  );

  return (
    <AdminPageLayout
      title="Gestion des événements"
      subtitle="Créer et gérer les événements de votre paroisse"
      allow={canManageAgenda}
      headerAction={
        <Button
          size="sm"
          icon={<CalendarPlus className="size-4" />}
          onClick={() => setShowForm((prev) => !prev)}
        >
          {showForm ? 'Annuler' : 'Nouvel événement'}
        </Button>
      }
      toolbar={
        <FilterPills
          options={EVENT_TYPE_FILTERS}
          value={selectedType}
          onChange={setSelectedType}
          ariaLabel="Filtrer par type d'événement"
        />
      }
    >
      <div className="space-y-8">
        {showForm && (
          <Card variant="sacred">
            <CardContent className="p-5">
              <CardEyebrow className="mb-1">Nouveau</CardEyebrow>
              <CardTitle className="mb-4 font-serif text-lg">
                Nouvel événement
              </CardTitle>
              <EventForm onSuccess={() => setShowForm(false)} />
            </CardContent>
          </Card>
        )}

        <section>
          <SectionHeader eyebrow="Calendrier paroissial" title="Événements" />

          {eventsLoading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} variant="flat">
                  <CardContent className="space-y-3 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!eventsLoading && data?.results.length === 0 && (
            <Card variant="ghost">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Aucun événement publié.
              </CardContent>
            </Card>
          )}

          {!eventsLoading && data && data.results.length > 0 && (
            <div className="space-y-4">
              {data.results.map((event) => (
                <EventCard key={event.id} event={event} canDelete />
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminPageLayout>
  );
}
