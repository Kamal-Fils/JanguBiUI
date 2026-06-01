'use client';

import { ArrowRight, CheckCircle, MapPin, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/dialog';
import { useNotifications } from '@/components/ui/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

import { useAcknowledgeTransfer, useApproveTransfer, useRejectTransfer } from '../api/manage-transfer';
import { TransferRequest, TRANSFER_STATUS_LABELS } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function AdminTransferCard({ transfer }: { transfer: TransferRequest }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { addNotification } = useNotifications();

  const { mutate: approve, isPending: approving } = useApproveTransfer();
  const { mutate: reject, isPending: rejecting } = useRejectTransfer();
  const { mutate: acknowledge, isPending: acknowledging } = useAcknowledgeTransfer();

  const canApprove = transfer.status === 'pending';
  const canAcknowledge = transfer.status === 'approved_by_origin';
  const isTerminal = transfer.status === 'completed' || transfer.status === 'rejected';

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <MapPin className="size-3" />
              <span className="truncate">
                {transfer.origin_parish_name ?? '—'}
              </span>
              <ArrowRight className="size-3 shrink-0" />
              <span className="truncate">
                {transfer.destination_parish_name ?? '—'}
              </span>
            </div>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {TRANSFER_STATUS_LABELS[transfer.status]}
            </span>
            {transfer.reason && (
              <p className="mt-1.5 text-xs italic text-muted-foreground line-clamp-2">
                « {transfer.reason} »
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(transfer.created_at)}
            </p>
          </div>

          {!isTerminal && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {canApprove && (
                <>
                  <Button
                    size="sm"
                    onClick={() =>
                      approve(transfer.id, {
                        onSuccess: () =>
                          addNotification({ type: 'success', title: 'Approuvé', message: 'La demande a été approuvée.' }),
                      })
                    }
                    disabled={approving}
                  >
                    {approving ? <Spinner className="size-3.5" /> : <CheckCircle className="mr-1.5 size-3.5" />}
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRejectOpen(true)}
                  >
                    <XCircle className="mr-1.5 size-3.5" />
                    Refuser
                  </Button>
                </>
              )}
              {canAcknowledge && (
                <Button
                  size="sm"
                  onClick={() =>
                    acknowledge(transfer.id, {
                      onSuccess: () =>
                        addNotification({ type: 'success', title: 'Accusé réception', message: 'La réception a été enregistrée.' }),
                    })
                  }
                  disabled={acknowledging}
                >
                  {acknowledging ? <Spinner className="size-3.5" /> : <CheckCircle className="mr-1.5 size-3.5" />}
                  Accuser réception
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          if (!open) setRejectReason('');
          setRejectOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le transfert</DialogTitle>
            <DialogDescription>
              Le fidèle recevra une notification avec le motif du refus.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Motif du refus (requis)…"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejecting}
              onClick={() =>
                reject(
                  { transferId: transfer.id, reason: rejectReason },
                  {
                    onSuccess: () => {
                      setRejectOpen(false);
                      setRejectReason('');
                      addNotification({ type: 'success', title: 'Refus enregistré', message: 'La demande a été refusée.' });
                    },
                  },
                )
              }
            >
              {rejecting ? <Spinner className="size-4" /> : 'Confirmer le refus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface AdminTransferListProps {
  transfers: TransferRequest[];
  isLoading?: boolean;
}

export function AdminTransferList({ transfers, isLoading }: AdminTransferListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <CheckCircle className="size-8 text-green-500/60" />
        <p className="text-sm text-muted-foreground">Aucune demande de transfert.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transfers.map((transfer) => (
        <AdminTransferCard key={transfer.id} transfer={transfer} />
      ))}
    </div>
  );
}
