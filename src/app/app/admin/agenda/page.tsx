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
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { SectionHeader } from '@/components/ui/section-header';
import { useEvents } from '@/features/agenda/api/get-events';
import { AdminEventList } from '@/features/agenda/components/admin-event-list';
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
  const {
    data,
    isLoading: eventsLoading,
    isError,
    refetch,
  } = useEvents(
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

          {isError ? (
            <ErrorState
              title="Impossible de charger les événements"
              onRetry={() => refetch()}
            />
          ) : (
            <AdminEventList
              events={data?.results}
              isLoading={eventsLoading}
            />
          )}
        </section>
      </div>
    </AdminPageLayout>
  );
}
