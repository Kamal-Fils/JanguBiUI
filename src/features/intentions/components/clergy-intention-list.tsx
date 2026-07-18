'use client';

import {
  CalendarClock,
  CheckCircle2,
  Inbox,
  MoreHorizontal,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

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
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import { cn } from '@/utils/cn';
import { formatFrDate } from '@/utils/format-date';

import { type MassIntention } from '../api/get-my-intentions';
import {
  useAcceptIntention,
  useCelebrateIntention,
  useDeclineIntention,
  useProposeDate,
} from '../api/manage-intentions';

import { IntentionStatusBadge } from './intention-status-badge';
import {
  INTENTION_TYPE_META,
  getIntentionTypeLabel,
} from './intention-type-label';

/** En-têtes de colonnes « admin sobre » : micro-capitales espacées. */
const TH_CLASS = 'text-[11px] uppercase tracking-wide text-muted-foreground';

/**
 * Transitions autorisées par le backend (`apps/mass_intentions/services.py`) :
 * - accept        : pending
 * - decline       : pending | accepted
 * - propose-date  : accepted | confirmed
 * - celebrate     : accepted | date_proposed | confirmed
 * On ne propose JAMAIS une action que le backend refuserait (400 assuré).
 */
const canAccept = (status: string) => status === 'pending';
const canDecline = (status: string) =>
  status === 'pending' || status === 'accepted';
const canProposeDate = (status: string) =>
  status === 'accepted' || status === 'confirmed';
const canCelebrate = (status: string) =>
  status === 'accepted' || status === 'date_proposed' || status === 'confirmed';

const hasActions = (status: string) =>
  canAccept(status) ||
  canDecline(status) ||
  canProposeDate(status) ||
  canCelebrate(status);

interface IntentionRowActionsProps {
  intention: MassIntention;
  onAccept: (intention: MassIntention) => void;
  onCelebrate: (intention: MassIntention) => void;
  onProposeDate: (intention: MassIntention) => void;
  onDecline: (intention: MassIntention) => void;
}

/** Actions par ligne regroupées dans un menu « ⋯ » (pattern agenda/actus). */
function IntentionRowActions({
  intention,
  onAccept,
  onCelebrate,
  onProposeDate,
  onDecline,
}: IntentionRowActionsProps) {
  if (!hasActions(intention.status)) {
    return (
      <span className="text-sm text-muted-foreground" aria-hidden="true">
        —
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions pour l'intention de ${intention.requestor_email}`}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {canAccept(intention.status) && (
          <DropdownMenuItem onSelect={() => onAccept(intention)}>
            <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
            Accepter
          </DropdownMenuItem>
        )}
        {canProposeDate(intention.status) && (
          <DropdownMenuItem onSelect={() => onProposeDate(intention)}>
            <CalendarClock className="mr-2 size-4" aria-hidden="true" />
            Proposer une date
          </DropdownMenuItem>
        )}
        {canCelebrate(intention.status) && (
          <DropdownMenuItem onSelect={() => onCelebrate(intention)}>
            <Sparkles className="mr-2 size-4" aria-hidden="true" />
            Marquer célébrée
          </DropdownMenuItem>
        )}
        {canDecline(intention.status) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={() => onDecline(intention)}
            >
              <XCircle className="mr-2 size-4" aria-hidden="true" />
              Refuser
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ClergyIntentionListProps {
  intentions: MassIntention[] | undefined;
  isLoading?: boolean;
  /** État vide contextuel (ex. filtre actif) — défaut : EmptyState incitatif. */
  emptyState?: ReactNode;
}

/**
 * Liste de traitement des intentions de messe (vue clergé) — pattern
 * DataTable + menu « ⋯ » (cf. agenda admin). Les gardes métier ne changent
 * pas : chaque action n'apparaît que si la transition est permise par le
 * backend, et l'accès à la liste reste gardé en amont par la page
 * (`isClergy` + redirect).
 */
export function ClergyIntentionList({
  intentions,
  isLoading,
  emptyState,
}: ClergyIntentionListProps) {
  const { addNotification } = useNotifications();
  const [declineTarget, setDeclineTarget] = useState<MassIntention | null>(null);
  const [declineNotes, setDeclineNotes] = useState('');
  const [proposeTarget, setProposeTarget] = useState<MassIntention | null>(null);
  const [dateInput, setDateInput] = useState('');

  const { mutate: accept, isPending: accepting } = useAcceptIntention();
  const { mutate: celebrate, isPending: celebrating } = useCelebrateIntention();
  const { mutate: decline, isPending: declining } = useDeclineIntention();
  const { mutate: proposeDate, isPending: proposingDate } = useProposeDate();

  function handleAccept(intention: MassIntention) {
    if (accepting) return;
    accept(intention.id, {
      onSuccess: () =>
        addNotification({
          type: 'success',
          title: 'Intention acceptée',
          message: 'Le fidèle sera informé de la prise en charge.',
        }),
    });
  }

  function handleCelebrate(intention: MassIntention) {
    if (celebrating) return;
    celebrate(intention.id, {
      onSuccess: () =>
        addNotification({
          type: 'success',
          title: 'Intention célébrée',
          message: "L'intention a été marquée comme célébrée.",
        }),
    });
  }

  function handleConfirmProposeDate() {
    if (!proposeTarget || !dateInput) return;
    proposeDate(
      { intentionId: proposeTarget.id, proposed_date: dateInput },
      {
        onSuccess: () => {
          setProposeTarget(null);
          setDateInput('');
          addNotification({
            type: 'success',
            title: 'Date proposée',
            message: 'La date de célébration a été proposée au fidèle.',
          });
        },
      },
    );
  }

  function handleConfirmDecline() {
    if (!declineTarget) return;
    decline(
      { intentionId: declineTarget.id, notes: declineNotes.trim() || undefined },
      {
        onSuccess: () => {
          setDeclineTarget(null);
          setDeclineNotes('');
          addNotification({
            type: 'success',
            title: 'Refus enregistré',
            message: "L'intention a été refusée.",
          });
        },
      },
    );
  }

  const columns: DataTableColumn<MassIntention>[] = [
    {
      header: 'Intention',
      mobileLabel: 'Intention',
      headClassName: TH_CLASS,
      cell: (intention) => {
        const TypeIcon = INTENTION_TYPE_META[intention.intention_type]?.icon;
        return (
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gold-ink [&_svg]:size-3.5">
              {TypeIcon && <TypeIcon aria-hidden="true" />}
              <span className="truncate">
                {getIntentionTypeLabel(intention.intention_type)}
              </span>
            </p>
            <p className="mt-0.5 line-clamp-2 font-serif text-sm text-foreground">
              {intention.intention_text}
            </p>
          </div>
        );
      },
    },
    {
      header: 'Demandeur',
      mobileLabel: 'De',
      headClassName: TH_CLASS,
      cell: (intention) => (
        <span className="block max-w-64 truncate text-sm text-muted-foreground">
          {intention.requestor_email}
        </span>
      ),
    },
    {
      header: 'Statut',
      headClassName: TH_CLASS,
      cell: (intention) => <IntentionStatusBadge status={intention.status} />,
    },
    {
      header: 'Reçue le',
      headClassName: TH_CLASS,
      cell: (intention) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatFrDate(intention.created_at, 'short')}
        </span>
      ),
    },
    {
      header: 'Date proposée',
      headClassName: TH_CLASS,
      hideOnMobile: true,
      cell: (intention) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {intention.proposed_date
            ? formatFrDate(intention.proposed_date, 'short')
            : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      headClassName: cn(TH_CLASS, 'text-right'),
      className: 'text-right',
      cell: (intention) => (
        <IntentionRowActions
          intention={intention}
          onAccept={handleAccept}
          onCelebrate={handleCelebrate}
          onProposeDate={(target) => {
            setProposeTarget(target);
            setDateInput('');
          }}
          onDecline={(target) => {
            setDeclineTarget(target);
            setDeclineNotes('');
          }}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={intentions}
        columns={columns}
        rowKey={(intention) => intention.id}
        isLoading={isLoading}
        caption="Intentions de messe de la paroisse"
        emptyState={
          emptyState ?? (
            <EmptyState
              icon={<Inbox aria-hidden="true" />}
              title="Aucune intention à traiter"
              description="Les intentions de messe confiées par les fidèles de votre paroisse apparaîtront ici. Vous pourrez alors les accepter, proposer une date puis les marquer célébrées."
            />
          )
        }
      />

      {/* Dialogue : proposer une date de célébration */}
      <Dialog
        open={!!proposeTarget}
        onOpenChange={(open) => {
          if (!open) {
            setProposeTarget(null);
            setDateInput('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proposer une date de célébration</DialogTitle>
            <DialogDescription>
              Le fidèle sera informé de la date proposée pour la célébration de
              son intention.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label
              htmlFor="propose-date-input"
              className="text-sm font-medium text-foreground"
            >
              Date de célébration proposée{' '}
              <span className="text-destructive">*</span>
            </label>
            <Input
              id="propose-date-input"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProposeTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="gold"
              isLoading={proposingDate}
              disabled={!dateInput || proposingDate}
              onClick={handleConfirmProposeDate}
            >
              Proposer cette date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue : refuser l'intention */}
      <Dialog
        open={!!declineTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeclineTarget(null);
            setDeclineNotes('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser l&apos;intention</DialogTitle>
            <DialogDescription>
              Le fidèle sera informé du refus. Vous pouvez préciser un motif
              (optionnel).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label
              htmlFor="decline-notes-textarea"
              className="text-sm font-medium text-foreground"
            >
              Motif du refus
            </label>
            <textarea
              id="decline-notes-textarea"
              value={declineNotes}
              onChange={(e) => setDeclineNotes(e.target.value)}
              rows={3}
              className="flex min-h-[60px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Expliquez le motif du refus…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              isLoading={declining}
              disabled={declining}
              onClick={handleConfirmDecline}
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
