'use client';

import { ChevronDown, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

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

/**
 * Position de l'événement dans le rythme du fil (DIRECTION R6, archétype
 * **Flux**) :
 *
 * - `lead` — le prochain rendez-vous, en pleine échelle. Un seul par page.
 * - `band` — les suivants, pleine largeur, denses. C'est le défaut : c'est
 *   sous cette forme que l'accueil du fidèle affiche ses trois événements.
 * - `brief` — le lointain, en une ligne typographique, sans inscription : on
 *   passe par le détail pour s'engager sur une date à trois mois.
 */
export type EventCardVariant = 'lead' | 'band' | 'brief';

interface EventCardProps {
  event: Event;
  variant?: EventCardVariant;
}

const MONTH_FMT = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const TIME_FMT = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Bloc date — le « visuel porteur » du fil agenda. Les actualités ont une
 * image ; un événement a une date, et c'est elle qu'on cherche du regard. En
 * lui donnant l'échelle (R2), le fil devient scannable sans lire les titres.
 */
function DateBlock({ start, large }: { start: Date; large?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex shrink-0 flex-col items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary',
        large ? 'size-20 sm:size-24' : 'size-14',
      )}
    >
      <span
        className={cn(
          'font-bold tabular-nums leading-none',
          large ? 'text-3xl sm:text-4xl' : 'text-xl',
        )}
      >
        {start.getDate()}
      </span>
      <span
        className={cn(
          'mt-0.5 font-semibold uppercase tracking-wide',
          large ? 'text-xs' : 'text-[10px]',
        )}
      >
        {MONTH_FMT.format(start).replace('.', '')}
      </span>
      {large && (
        <span className="mt-1 text-xs tabular-nums opacity-80">
          {TIME_FMT.format(start)}
        </span>
      )}
    </div>
  );
}

interface RegistrationButtonProps {
  event: Event;
  isFull: boolean;
  fullWidth?: boolean;
}

function RegistrationButton({
  event,
  isFull,
  fullWidth,
}: RegistrationButtonProps) {
  const { addNotification } = useNotifications();
  const { mutate: register, isPending: registering } = useRegisterEvent();
  const { mutate: unregister, isPending: unregistering } = useUnregisterEvent();
  const isPendingAction = registering || unregistering;

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

  return (
    <button
      type="button"
      onClick={handleRegistration}
      disabled={isPendingAction || (isFull && !event.is_registered)}
      className={cn(
        'relative z-10 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 motion-reduce:transition-none',
        fullWidth && 'w-full',
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
  );
}

/** Lieu et jauge d'inscrits — les deux seules métadonnées qui décident d'y aller. */
function EventMeta({ event, isFull }: { event: Event; isFull: boolean }) {
  if (!event.location && event.max_participants == null) return null;

  return (
    <div className="relative z-10 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {event.location && (
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {event.location}
        </span>
      )}
      {event.max_participants != null && (
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">
            {event.registration_count} / {event.max_participants} inscrits
          </span>
          {isFull && (
            <span className="font-medium text-destructive">· Complet</span>
          )}
        </span>
      )}
    </div>
  );
}

/**
 * Carte d'événement du fil agenda.
 *
 * Le fil agenda ne se lit pas comme une grille : la proximité dans le temps
 * *est* l'importance. Les trois variantes traduisent ce dégradé d'échelle et
 * de densité — c'est ce qu'une pile de cartes identiques ne pouvait pas dire.
 */
export function EventCard({ event, variant = 'band' }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);

  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const isFull =
    event.max_participants != null &&
    event.registration_count >= event.max_participants;
  const hasDescription = Boolean(event.description);
  const detailsId = `event-${event.id}-details`;
  const href = paths.app.agendaEvent.getHref(event.id);

  const typeLabel = EVENT_TYPE_LABELS[event.event_type] ?? event.event_type;
  const scopeLabel = EVENT_SCOPE_LABELS[event.scope_type] ?? event.scope_type;

  // ── Brève : une ligne, aucune décoration ───────────────────────────────────
  if (variant === 'brief') {
    return (
      <Link
        href={href}
        className="group flex min-h-11 items-baseline gap-3 py-2.5 transition-colors"
      >
        <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wide tabular-nums text-primary">
          {start.getDate()} {MONTH_FMT.format(start).replace('.', '')}
        </span>
        <span className="min-w-0 flex-1 truncate font-serif text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline">
          {event.title}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {typeLabel}
        </span>
      </Link>
    );
  }

  // ── La une : le prochain rendez-vous ───────────────────────────────────────
  if (variant === 'lead') {
    return (
      <article className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card p-5 shadow-soft sm:p-6">
        {/* Filet bleu : la signature de marque tient la une (R4). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-primary"
        />

        <div className="relative flex gap-4 sm:gap-5">
          <DateBlock start={start} large />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill
                tone="muted"
                className={EVENT_TYPE_COLORS[event.event_type]}
              >
                {typeLabel}
              </Pill>
              <Pill tone="outline">{scopeLabel}</Pill>
            </div>

            <Link href={href} className="group mt-2 block">
              <h3 className="font-serif text-headline font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                {event.title}
              </h3>
            </Link>

            <p className="mt-1.5 text-sm capitalize tabular-nums text-muted-foreground">
              {formatEventDate(start, end)}
            </p>

            <EventMeta event={event} isFull={isFull} />
          </div>
        </div>

        {hasDescription && (
          <p className="relative mt-4 max-w-prose whitespace-pre-line text-[15px] leading-relaxed text-foreground/80">
            {event.description}
          </p>
        )}

        <div className="relative mt-5">
          <RegistrationButton event={event} isFull={isFull} fullWidth />
        </div>
      </article>
    );
  }

  // ── Bande : les suivants ───────────────────────────────────────────────────
  return (
    <article
      className={cn(
        'relative rounded-xl border border-border bg-card p-4 transition-[box-shadow,border-color] duration-[var(--duration-normal)] ease-out-soft',
        hasDescription && 'hover:border-primary/30 hover:shadow-soft',
      )}
    >
      {/* Surface cliquable plein-carte : déploie/replie la description.
          Les actions (lien titre, inscription) restent au-dessus via z-10. */}
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
          className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      )}

      <div className="relative z-10 flex gap-3.5">
        <DateBlock start={start} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
            <Link
              href={href}
              className="min-w-0 flex-1 font-serif text-base font-semibold leading-snug text-foreground transition-colors hover:text-primary focus-visible:underline focus-visible:outline-none"
            >
              <h3 className="truncate">{event.title}</h3>
            </Link>
            <div className="flex shrink-0 items-center gap-1.5">
              <Pill
                tone="muted"
                className={EVENT_TYPE_COLORS[event.event_type]}
              >
                {typeLabel}
              </Pill>
              <Pill tone="outline">{scopeLabel}</Pill>
            </div>
          </div>

          <p className="mt-0.5 text-xs capitalize tabular-nums text-muted-foreground">
            {formatEventDate(start, end)}
          </p>

          <EventMeta event={event} isFull={isFull} />
        </div>
      </div>

      {hasDescription && (
        <>
          <p
            id={detailsId}
            className={cn(
              'relative z-10 mt-3 text-sm text-muted-foreground',
              expanded ? 'whitespace-pre-line' : 'line-clamp-2',
            )}
          >
            {event.description}
          </p>
          <span className="relative z-10 mt-1.5 flex items-center gap-1 text-[11px] font-medium text-primary">
            <ChevronDown
              className={cn(
                'size-3.5 shrink-0 transition-transform duration-[var(--duration-normal)] ease-out-soft motion-reduce:transition-none',
                expanded && 'rotate-180',
              )}
              aria-hidden="true"
            />
            {expanded ? 'Masquer les détails' : 'Voir les détails'}
          </span>
        </>
      )}

      <div className="relative z-10 mt-3.5">
        <RegistrationButton event={event} isFull={isFull} fullWidth />
      </div>
    </article>
  );
}
