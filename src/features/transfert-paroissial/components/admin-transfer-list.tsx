'use client';

import {
  ArrowRight,
  CheckCircle,
  Inbox,
  MapPin,
  MoreHorizontal,
  XCircle,
} from 'lucide-react';
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

import {
  useAcknowledgeTransfer,
  useApproveTransfer,
  useRejectTransfer,
} from '../api/manage-transfer';
import { TransferRequest } from '../types';

import { TransferStatusBadge } from './transfer-status-badge';

/** En-têtes de colonnes « admin sobre » : micro-capitales espacées. */
const TH_CLASS = 'text-[11px] uppercase tracking-wide text-muted-foreground';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Vignette du trajet (pendant des vignettes actus/agenda). */
function TransferThumb() {
  return (
    <div
      aria-hidden="true"
      className="hidden size-10 shrink-0 items-center justify-center rounded-md bg-success/10 text-success md:flex"
    >
      <MapPin className="size-4" />
    </div>
  );
}

interface TransferRowActionsProps {
  transfer: TransferRequest;
  onApprove: (transfer: TransferRequest) => void;
  onAcknowledge: (transfer: TransferRequest) => void;
  onRejectRequest: (transfer: TransferRequest) => void;
}

/**
 * Actions par ligne regroupées dans un menu « ⋯ ». Les gardes métier sont
 * inchangées : Approuver/Refuser uniquement en `pending` (paroisse d'origine),
 * Accuser réception uniquement en `approved_by_origin` (paroisse d'accueil),
 * aucune action sur les statuts terminaux (`completed`, `rejected`).
 */
function TransferRowActions({
  transfer,
  onApprove,
  onAcknowledge,
  onRejectRequest,
}: TransferRowActionsProps) {
  const canApprove = transfer.status === 'pending';
  const canAcknowledge = transfer.status === 'approved_by_origin';

  if (!canApprove && !canAcknowledge) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions pour la demande #${transfer.id}`}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {canApprove && (
          <>
            <DropdownMenuItem onSelect={() => onApprove(transfer)}>
              <CheckCircle className="mr-2 size-4" aria-hidden="true" />
              Approuver
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={() => onRejectRequest(transfer)}
            >
              <XCircle className="mr-2 size-4" aria-hidden="true" />
              Refuser
            </DropdownMenuItem>
          </>
        )}
        {canAcknowledge && (
          <DropdownMenuItem onSelect={() => onAcknowledge(transfer)}>
            <CheckCircle className="mr-2 size-4" aria-hidden="true" />
            Accuser réception
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AdminTransferListProps {
  transfers: TransferRequest[];
  isLoading?: boolean;
}

/**
 * Liste clergé des demandes de transfert — pattern DataTable + menu « ⋯ »
 * (cf. agenda/actus). L'accès reste gardé en amont par la page
 * (`isClergy` + `enabled` sur la query) : aucune condition métier ne change,
 * seule la présentation.
 */
export function AdminTransferList({
  transfers,
  isLoading,
}: AdminTransferListProps) {
  const { addNotification } = useNotifications();
  const [rejectTarget, setRejectTarget] = useState<TransferRequest | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState('');

  const { mutate: approve } = useApproveTransfer();
  const { mutate: reject, isPending: rejecting } = useRejectTransfer();
  const { mutate: acknowledge } = useAcknowledgeTransfer();

  function handleApprove(transfer: TransferRequest) {
    approve(transfer.id, {
      onSuccess: () =>
        addNotification({
          type: 'success',
          title: 'Approuvé',
          message: 'La demande a été approuvée.',
        }),
    });
  }

  function handleAcknowledge(transfer: TransferRequest) {
    acknowledge(transfer.id, {
      onSuccess: () =>
        addNotification({
          type: 'success',
          title: 'Accusé réception',
          message: 'La réception a été enregistrée.',
        }),
    });
  }

  function closeRejectDialog() {
    setRejectTarget(null);
    setRejectReason('');
  }

  function handleConfirmReject() {
    if (!rejectTarget) return;
    reject(
      { transferId: rejectTarget.id, reason: rejectReason },
      {
        onSuccess: () => {
          closeRejectDialog();
          addNotification({
            type: 'success',
            title: 'Refus enregistré',
            message: 'La demande a été refusée.',
          });
        },
      },
    );
  }

  const columns: DataTableColumn<TransferRequest>[] = [
    {
      header: 'Demande',
      mobileLabel: 'Trajet',
      headClassName: TH_CLASS,
      cell: (transfer) => (
        <div className="flex min-w-0 items-center gap-3">
          <TransferThumb />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <span className="truncate">
                {transfer.origin_parish_name ?? '—'}
              </span>
              <ArrowRight
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="truncate">
                {transfer.destination_parish_name ?? '—'}
              </span>
            </p>
            {transfer.reason && (
              <p className="line-clamp-1 text-xs italic text-muted-foreground">
                « {transfer.reason} »
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Statut',
      headClassName: TH_CLASS,
      cell: (transfer) => <TransferStatusBadge status={transfer.status} />,
    },
    {
      header: 'Date',
      mobileLabel: 'Soumise le',
      headClassName: TH_CLASS,
      cell: (transfer) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatDate(transfer.created_at)}
        </span>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      headClassName: `${TH_CLASS} text-right`,
      className: 'text-right',
      cell: (transfer) => (
        <TransferRowActions
          transfer={transfer}
          onApprove={handleApprove}
          onAcknowledge={handleAcknowledge}
          onRejectRequest={setRejectTarget}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={transfers}
        columns={columns}
        rowKey={(transfer) => transfer.id}
        isLoading={isLoading}
        caption="Demandes de transfert paroissial"
        emptyState={
          <EmptyState
            icon={<Inbox aria-hidden="true" />}
            title="Aucune demande de transfert"
            description="Dès qu'un fidèle demandera un rattachement impliquant votre paroisse, sa demande apparaîtra ici pour approbation ou accusé de réception."
          />
        }
      />

      {/* Dialogue de refus (motif obligatoire, transmis au fidèle) */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) closeRejectDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le transfert</DialogTitle>
            <DialogDescription>
              Le fidèle recevra une notification avec le motif du refus.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label
              htmlFor="reject-reason-textarea"
              className="text-sm font-medium text-foreground"
            >
              Motif du refus <span className="text-destructive">*</span>
            </label>
            <textarea
              id="reject-reason-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              required
              className="flex min-h-[60px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Expliquez le motif du refus…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRejectDialog}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              isLoading={rejecting}
              disabled={!rejectReason.trim() || rejecting}
              onClick={handleConfirmReject}
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
