'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvents } from '@/features/agenda/api/get-events';
import { EventCard } from '@/features/agenda/components/event-card';
import { EventForm } from '@/features/agenda/components/event-form';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { isClergy, isAdmin } from '@/lib/authorization';
import { cn } from '@/lib/utils';

const EVENT_TYPE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'mass', label: 'Messes' },
  { value: 'conference', label: 'Conférences' },
  { value: 'retreat', label: 'Retraites' },
  { value: 'ordination', label: 'Ordinations' },
  { value: 'other', label: 'Autres' },
];

export default function AdminAgendaPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const [selectedType, setSelectedType] = useState('');
  const [showForm, setShowForm] = useState(false);

  const canManage = !userLoading && (isClergy(user) || isAdmin(user));
  const { data, isLoading: eventsLoading } = useEvents(
    selectedType ? { event_type: selectedType } : undefined,
    canManage,
  );

  useEffect(() => {
    if (!userLoading && !canManage) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, userLoading, canManage, router]);

  if (userLoading || !canManage) return null;

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader
          title="Gestion des événements"
          subtitle="Créer et gérer les événements de votre paroisse"
          action={
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <CalendarPlus className="size-4" />
              {showForm ? 'Annuler' : 'Nouvel événement'}
            </button>
          }
        />

        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8 space-y-6">
          {showForm && (
            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Nouvel événement
              </h2>
              <EventForm onSuccess={() => setShowForm(false)} />
            </section>
          )}

          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {EVENT_TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setSelectedType(filter.value)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    selectedType === filter.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {eventsLoading && (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {!eventsLoading && data?.results.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Aucun événement publié.
              </p>
            )}

            {!eventsLoading && data && data.results.length > 0 && (
              <div className="space-y-4">
                {data.results.map((event) => (
                  <EventCard key={event.id} event={event} canDelete />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
