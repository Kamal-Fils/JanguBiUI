'use client';

import { Calendar, ChevronDown, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Card, CardEyebrow } from '@/components/ui/card/card';
import { useNotifications } from '@/components/ui/notifications';
import { Pill } from '@/components/ui/pill';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { cn } from '@/lib/utils';

import type { Event } from '../api/get-events';
import { useRegisterEvent } from '../api/register-event';
import { useUnregisterEvent } from '../api/unregister-event';
import {
  EVENT_SCOPE_LABELS,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  formatEventDate,
} from '../utils';

interface EventCardProps {
  event: Event;
}

// La suppression admin ne vit plus ici : elle passe par le menu « ⋯ » de la
// table de gestion (admin-event-list). La carte reste purement « fidèle ».
export function EventCard({ event }: EventCardProps) {
  const { addNotification } = useNotifications();
  const [expanded, setExpanded] = useState(false);
  const { mutate: register, isPending: registering } = useRegisterEvent();
  const { mutate: unregister, isPending: unregistering } = useUnregisterEvent();

  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const isFull =
    event.max_participants != null &&
    event.registration_count >= event.max_participants;
  const hasDescription = Boolean(event.description);
  const detailsId = `event-${event.id}-details`;

  function handleRegistration() {
    if (event.is_registered) {
      unregister(event.id, {
        onSuccess: () =>
          addNotification({
            type: 'success',
            title: 'Désinscrit',
            message: 'Votre inscription a été annulée.',
          }),
      });
    } else {
      register(event.id, {
        onSuccess: () =>
          addNotification({
            type: 'success',
            title: 'Inscrit',
            message: 'Votre inscription est confirmée.',
          }),
      });
    }
  }

  const isPendingAction = registering || unregistering;

  return (
    <Card
      variant="feature"
      className={cn(
        'relative p-4 transition-[box-shadow,border-color] duration-[var(--duration-normal)] ease-out-soft',
        hasDescription &&
          'hover:border-accent/40 hover:shadow-soft focus-within:border-accent/40',
      )}
    >
      {/* Surface cliquable plein-carte : déploie/replie la description.
          Les boutons d'action (inscription) restent au-dessus via z-10. */}
      {hasDescription && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={
            expanded
              ? `Replier la description de ${event.title}`
              : `Voir la description de ${event.title}`
          }
          className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      )}

      <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <CardEyebrow className="mb-1 flex items-center gap-1.5 text-gold-ink">
            <Calendar className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate capitalize tabular-nums tracking-[0.12em]">
              {formatEventDate(start, end)}
            </span>
          </CardEyebrow>
          {/* Lien vers la page de détail (develop) + style éditorial (refonte).
              relative z-10 : reste cliquable au-dessus de l'overlay « déplier ». */}
          <Link
            href={paths.app.agendaEvent.getHref(event.id)}
            className="relative z-10 inline-block font-serif text-base font-semibold leading-snug text-foreground transition-colors hover:text-primary focus-visible:underline focus-visible:outline-none"
          >
            <h3>{event.title}</h3>
          </Link>
        </div>
        {/* Type + portée : pills empilées, mêmes libellés que le fil actus. */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Pill tone="muted" className={EVENT_TYPE_COLORS[event.event_type]}>
            {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
          </Pill>
          <Pill tone="outline">
            {EVENT_SCOPE_LABELS[event.scope_type] ?? event.scope_type}
          </Pill>
        </div>
      </div>

      {hasDescription && (
        <p
          id={detailsId}
          className={cn(
            'relative z-10 mb-3 text-sm text-muted-foreground',
            expanded ? 'whitespace-pre-line' : 'line-clamp-2',
          )}
        >
          {event.description}
        </p>
      )}

      <div className="relative z-10 space-y-1.5 text-xs text-muted-foreground mb-4">
        {event.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{event.location}</span>
          </div>
        )}
        {event.max_participants != null && (
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">
              {event.registration_count} / {event.max_participants} inscrits
              {isFull && (
                <span className="ml-1 text-destructive font-medium">
                  · Complet
                </span>
              )}
            </span>
          </div>
        )}
        {hasDescription && (
          <div className="flex items-center gap-1 pt-0.5 text-gold-ink">
            <ChevronDown
              className={cn(
                'size-3.5 shrink-0 transition-transform duration-[var(--duration-normal)] ease-out-soft motion-reduce:transition-none',
                expanded && 'rotate-180',
              )}
              aria-hidden="true"
            />
            <span className="text-[11px] font-medium">
              {expanded ? 'Masquer les détails' : 'Voir les détails'}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleRegistration}
        disabled={isPendingAction || (isFull && !event.is_registered)}
        className={cn(
          'relative z-10 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 motion-reduce:transition-none',
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
  );
}
