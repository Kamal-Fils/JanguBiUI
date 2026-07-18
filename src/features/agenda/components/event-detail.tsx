'use client';

import { ArrowLeft, Calendar, MapPin, User, Users } from 'lucide-react';
import Link from 'next/link';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button/button';
import { Card, CardEyebrow } from '@/components/ui/card/card';
import { ErrorState } from '@/components/ui/error-state';
import { useNotifications } from '@/components/ui/notifications';
import { Pill } from '@/components/ui/pill';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { cn } from '@/lib/utils';

import { useEvent } from '../api/get-event';
import { useRegisterEvent } from '../api/register-event';
import { useUnregisterEvent } from '../api/unregister-event';
import {
  EVENT_SCOPE_LABELS,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  formatEventDate,
} from '../utils';

interface EventDetailProps {
  eventId: number;
}

function EventDetailSkeleton() {
  return (
    <ContentContainer width="reading">
      <Skeleton className="mb-4 h-4 w-24" />
      <Card variant="elevated" className="space-y-4 p-5">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </Card>
    </ContentContainer>
  );
}

export function EventDetail({ eventId }: EventDetailProps) {
  const { data: event, isLoading, isError, refetch } = useEvent(eventId);
  const { addNotification } = useNotifications();
  const { mutate: register, isPending: registering } = useRegisterEvent();
  const { mutate: unregister, isPending: unregistering } = useUnregisterEvent();

  useRegisterPageMeta({
    title: event?.title ?? 'Événement',
    leafLabel: event?.title,
    showHeading: false,
    backHref: paths.app.agenda.getHref(),
  });

  if (isLoading) return <EventDetailSkeleton />;

  if (isError || !event) {
    return (
      <ContentContainer width="reading">
        <ErrorState
          title="Événement introuvable"
          description="Cet événement n'existe plus ou n'a pas pu être chargé pour le moment."
          onRetry={() => refetch()}
        />
        <div className="mt-4 text-center">
          <Button variant="link" size="sm" asChild>
            <Link href={paths.app.agenda.getHref()}>
              Retour à l&apos;agenda
            </Link>
          </Button>
        </div>
      </ContentContainer>
    );
  }

  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const isFull =
    event.max_participants != null &&
    event.registration_count >= event.max_participants;
  const isPendingAction = registering || unregistering;

  function handleRegistration() {
    if (!event) return;
    const onSuccess = (title: string, message: string) => () =>
      addNotification({ type: 'success', title, message });
    if (event.is_registered) {
      unregister(event.id, {
        onSuccess: onSuccess('Désinscrit', 'Votre inscription a été annulée.'),
      });
    } else {
      register(event.id, {
        onSuccess: onSuccess('Inscrit', 'Votre inscription est confirmée.'),
      });
    }
  }

  return (
    <ContentContainer width="reading">
      <Link
        href={paths.app.agenda.getHref()}
        className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Agenda
      </Link>

      <Card variant="elevated" className="p-5 md:p-6">
        {/* Type + portée : mêmes libellés que le fil actus. */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <Pill tone="muted" className={EVENT_TYPE_COLORS[event.event_type]}>
            {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
          </Pill>
          <Pill tone="outline">
            {EVENT_SCOPE_LABELS[event.scope_type] ?? event.scope_type}
          </Pill>
        </div>

        <CardEyebrow className="mb-1.5 flex items-center gap-1.5 text-gold-ink">
          <Calendar className="size-3 shrink-0" aria-hidden="true" />
          <span className="capitalize tabular-nums tracking-[0.12em]">
            {formatEventDate(start, end)}
          </span>
        </CardEyebrow>

        <h1 className="font-serif text-2xl font-bold leading-tight tracking-tight text-foreground">
          {event.title}
        </h1>

        <div className="hairline-gold mb-5 mt-3" aria-hidden="true" />

        <div className="mb-5 space-y-2 text-sm text-muted-foreground">
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <span>{event.location}</span>
            </div>
          )}
          {event.organizer_email && (
            <div className="flex items-center gap-2">
              <User className="size-4 shrink-0" aria-hidden="true" />
              <span>{event.organizer_email}</span>
            </div>
          )}
          {event.max_participants != null && (
            <div className="flex items-center gap-2">
              <Users className="size-4 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">
                {event.registration_count} / {event.max_participants} inscrits
                {isFull && (
                  <span className="ml-1 font-medium text-destructive">
                    · Complet
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {event.description ? (
          <p className="mb-6 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-foreground/90">
            {event.description}
          </p>
        ) : (
          <p className="mb-6 text-sm italic text-muted-foreground">
            Aucune description pour cet événement.
          </p>
        )}

        <button
          type="button"
          onClick={handleRegistration}
          disabled={isPendingAction || (isFull && !event.is_registered)}
          className={cn(
            'flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 motion-reduce:transition-none',
            event.is_registered
              ? 'bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
          )}
        >
          {isPendingAction && <Spinner className="size-4" />}
          {event.is_registered
            ? 'Annuler mon inscription'
            : isFull
              ? 'Complet'
              : "S'inscrire"}
        </button>
      </Card>
    </ContentContainer>
  );
}
