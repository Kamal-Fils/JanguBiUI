'use client';

import { CalendarDays, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotifications } from '@/components/ui/notifications';
import { Pill } from '@/components/ui/pill';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { formatFrDate } from '@/utils/format-date';

import { useDeleteEvent } from '../api/delete-event';
import type { Event } from '../api/get-events';
import {
  EVENT_SCOPE_LABELS,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
} from '../utils';

/** En-têtes de colonnes « admin sobre » : micro-capitales espacées. */
const TH_CLASS = 'text-[11px] uppercase tracking-wide text-muted-foreground';

/** Vignette teintée selon le type d'événement (pendant des vignettes actus). */
function EventThumb({ event }: { event: Event }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'hidden size-10 shrink-0 items-center justify-center rounded-md md:flex',
        EVENT_TYPE_COLORS[event.event_type] ?? 'bg-muted text-muted-foreground',
      )}
    >
      <CalendarDays className="size-4" />
    </div>
  );
}

interface EventRowActionsProps {
  event: Event;
  onDeleteRequest: (event: Event) => void;
}

/** Actions par ligne regroupées dans un menu « ⋯ » (pas de rangée de boutons). */
function EventRowActions({ event, onDeleteRequest }: EventRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions pour ${event.title}`}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={paths.app.agendaEvent.getHref(event.id)}>
            <Eye className="mr-2 size-4" aria-hidden="true" />
            Voir
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={() => onDeleteRequest(event)}
        >
          <Trash2 className="mr-2 size-4" aria-hidden="true" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AdminEventListProps {
  events: Event[] | undefined;
  isLoading?: boolean;
}

/**
 * Liste admin des événements — pattern DataTable + menu « ⋯ » (cf. actus).
 * L'accès à cette liste (et donc à la suppression) reste gardé en amont par
 * la page admin (`AdminPageLayout allow` + `enabled` sur la query) : aucune
 * condition métier ne change, seule la présentation.
 */
export function AdminEventList({ events, isLoading }: AdminEventListProps) {
  const { addNotification } = useNotifications();
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const { mutate: deleteEvent, isPending: deleting } = useDeleteEvent();

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteEvent(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        addNotification({
          type: 'success',
          title: 'Supprimé',
          message: "L'événement a été supprimé.",
        });
      },
    });
  }

  const columns: DataTableColumn<Event>[] = [
    {
      header: 'Événement',
      mobileLabel: 'Titre',
      headClassName: TH_CLASS,
      cell: (event) => (
        <div className="flex min-w-0 items-center gap-3">
          <EventThumb event={event} />
          <div className="min-w-0">
            <p className="line-clamp-1 font-serif text-sm font-semibold text-foreground">
              {event.title}
            </p>
            {event.location && (
              <p className="truncate text-xs text-muted-foreground">
                {event.location}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      headClassName: TH_CLASS,
      cell: (event) => (
        <Pill tone="muted" className={EVENT_TYPE_COLORS[event.event_type]}>
          {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
        </Pill>
      ),
    },
    {
      header: 'Portée',
      headClassName: TH_CLASS,
      cell: (event) => (
        <Pill tone="outline">
          {EVENT_SCOPE_LABELS[event.scope_type] ?? event.scope_type}
        </Pill>
      ),
    },
    {
      header: 'Date',
      mobileLabel: 'Date',
      headClassName: TH_CLASS,
      cell: (event) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatFrDate(event.start_at, 'short')}
        </span>
      ),
    },
    {
      header: 'Inscrits',
      headClassName: TH_CLASS,
      hideOnMobile: true,
      cell: (event) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {event.registration_count}
          {event.max_participants != null && ` / ${event.max_participants}`}
        </span>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      headClassName: cn(TH_CLASS, 'text-right'),
      className: 'text-right',
      cell: (event) => (
        <EventRowActions event={event} onDeleteRequest={setDeleteTarget} />
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={events}
        columns={columns}
        rowKey={(event) => event.id}
        isLoading={isLoading}
        caption="Liste des événements"
        emptyState={
          <EmptyState
            icon={<CalendarDays />}
            title="Aucun événement au programme"
            description="Messe, retraite, conférence… Créez votre premier événement via « Nouvel événement » et faites vivre votre calendrier."
          />
        }
      />

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;événement</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer «&nbsp;{deleteTarget?.title}
              &nbsp;» ? Les inscriptions associées seront perdues. Cette action
              est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              isLoading={deleting}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
