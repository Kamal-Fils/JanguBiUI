'use client';

import { ArrowRight, CheckCircle, Inbox, MapPin, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotifications } from '@/components/ui/notifications';
import { SkeletonCard } from '@/components/ui/skeleton';

import {
  useAcknowledgeTransfer,
  useApproveTransfer,
  useRejectTransfer,
} from '../api/manage-transfer';
import { TransferRequest } from '../types';

import { TransferStatusBadge } from './transfer-status-badge';

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
  const { mutate: acknowledge, isPending: acknowledging } =
    useAcknowledgeTransfer();

  const canApprove = transfer.status === 'pending';
  const canAcknowledge = transfer.status === 'approved_by_origin';
  const isTerminal =
    transfer.status === 'completed' || transfer.status === 'rejected';

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {transfer.origin_parish_name ?? '—'}
              </span>
              <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {transfer.destination_parish_name ?? '—'}
              </span>
            </div>
            <TransferStatusBadge status={transfer.status} />
            {transfer.reason && (
              <p className="mt-2 line-clamp-2 text-xs italic text-muted-foreground">
                « {transfer.reason} »
              </p>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formatDate(transfer.created_at)}
            </p>
          </div>

          {!isTerminal && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {canApprove && (
                <>
                  <Button
                    size="sm"
                    className="h-9"
                    isLoading={approving}
                    icon={<CheckCircle className="size-3.5" />}
                    onClick={() =>
                      approve(transfer.id, {
                        onSuccess: () =>
                          addNotification({
                            type: 'success',
                            title: 'Approuvé',
                            message: 'La demande a été approuvée.',
                          }),
                      })
                    }
                    disabled={approving}
                  >
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-9"
                    icon={<XCircle className="size-3.5" />}
                    onClick={() => setRejectOpen(true)}
                  >
                    Refuser
                  </Button>
                </>
              )}
              {canAcknowledge && (
                <Button
                  size="sm"
                  className="h-9"
                  isLoading={acknowledging}
                  icon={<CheckCircle className="size-3.5" />}
                  onClick={() =>
                    acknowledge(transfer.id, {
                      onSuccess: () =>
                        addNotification({
                          type: 'success',
                          title: 'Accusé réception',
                          message: 'La réception a été enregistrée.',
                        }),
                    })
                  }
                  disabled={acknowledging}
                >
                  Accuser réception
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

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
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              isLoading={rejecting}
              disabled={!rejectReason.trim() || rejecting}
              onClick={() =>
                reject(
                  { transferId: transfer.id, reason: rejectReason },
                  {
                    onSuccess: () => {
                      setRejectOpen(false);
                      setRejectReason('');
                      addNotification({
                        type: 'success',
                        title: 'Refus enregistré',
                        message: 'La demande a été refusée.',
                      });
                    },
                  },
                )
              }
            >
              Confirmer le refus
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

export function AdminTransferList({
  transfers,
  isLoading,
}: AdminTransferListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <EmptyState
        icon={<Inbox aria-hidden="true" />}
        title="Aucune demande de transfert"
        description="Les demandes de transfert vers votre paroisse apparaîtront ici."
      />
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
