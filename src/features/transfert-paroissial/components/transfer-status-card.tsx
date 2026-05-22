'use client';

import { CheckCircle, Clock, MapPin, XCircle } from 'lucide-react';

import { TransferRequest, TransferStatus, TRANSFER_STATUS_LABELS } from '../types';

const STATUS_ICON: Record<TransferStatus, React.ReactNode> = {
  pending: <Clock className="size-5 text-amber-500" />,
  approved_by_origin: <Clock className="size-5 text-blue-500" />,
  acknowledged_by_destination: <Clock className="size-5 text-blue-600" />,
  completed: <CheckCircle className="size-5 text-green-500" />,
  rejected: <XCircle className="size-5 text-destructive" />,
};

const STATUS_BG: Record<TransferStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20',
  approved_by_origin: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20',
  acknowledged_by_destination: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20',
  completed: 'border-green-200 bg-green-50 dark:bg-green-950/20',
  rejected: 'border-destructive/30 bg-destructive/5',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface TransferStatusCardProps {
  transfer: TransferRequest;
}

export function TransferStatusCard({ transfer }: TransferStatusCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${STATUS_BG[transfer.status]}`}>
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background">
          {STATUS_ICON[transfer.status]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {TRANSFER_STATUS_LABELS[transfer.status]}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Demande soumise le {formatDate(transfer.created_at)}
          </p>
          {transfer.origin_parish_name && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              <span>
                {transfer.origin_parish_name} → {transfer.destination_parish_name ?? '…'}
              </span>
            </div>
          )}
          {transfer.reason && (
            <p className="mt-2 text-xs italic text-muted-foreground">
              « {transfer.reason} »
            </p>
          )}
          {transfer.status === 'rejected' && transfer.rejection_reason && (
            <p className="mt-2 text-xs text-destructive">
              Motif : {transfer.rejection_reason}
            </p>
          )}
        </div>
      </div>

      {transfer.status === 'completed' && (
        <p className="mt-3 text-xs font-medium text-green-700 text-center">
          Votre transfert paroissial est effectif. Bienvenue dans votre nouvelle paroisse !
        </p>
      )}
    </div>
  );
}
