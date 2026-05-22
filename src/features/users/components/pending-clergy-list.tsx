'use client';

import { CheckCircle, Clock, XCircle } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

import { PendingClergyAccount } from '../api/get-pending-clergy';
import { useApproveClergy, useRejectClergyAccount } from '../api/validate-clergy-account';

const ROLE_LABELS: Record<string, string> = {
  pretre: 'Prêtre',
  diacre: 'Diacre',
  eveque: 'Évêque',
  archeveque: 'Archevêque',
  religieux: 'Religieux',
};

const ROLE_COLORS: Record<string, string> = {
  pretre: 'bg-purple-100 text-purple-700',
  diacre: 'bg-violet-100 text-violet-700',
  eveque: 'bg-indigo-100 text-indigo-700',
  archeveque: 'bg-blue-100 text-blue-700',
  religieux: 'bg-teal-100 text-teal-700',
};

function PendingClergyCard({ account }: { account: PendingClergyAccount }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { mutate: approve, isPending: approving } = useApproveClergy();
  const { mutate: reject, isPending: rejecting } = useRejectClergyAccount();

  const fullName =
    [account.first_name, account.last_name].filter(Boolean).join(' ') ||
    account.email;

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-foreground truncate">
                {fullName}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[account.pastoral_role] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {ROLE_LABELS[account.pastoral_role] ?? account.pastoral_role}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{account.email}</p>
            {account.diocese_name && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Diocèse : {account.diocese_name}
              </p>
            )}
            {account.parish_name && (
              <p className="text-xs text-muted-foreground">
                Paroisse : {account.parish_name}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              onClick={() => approve(account.id)}
              disabled={approving}
            >
              {approving ? (
                <Spinner className="size-3.5" />
              ) : (
                <CheckCircle className="mr-1.5 size-3.5" />
              )}
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
          </div>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le compte de {fullName}</DialogTitle>
            <DialogDescription>
              Un email de notification sera envoyé à {account.email}.
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
                  { userId: account.id, reason: rejectReason },
                  {
                    onSuccess: () => {
                      setRejectOpen(false);
                      setRejectReason('');
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

function PendingClergyListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

interface PendingClergyListProps {
  accounts: PendingClergyAccount[];
  totalCount: number;
  isLoading?: boolean;
}

export function PendingClergyList({ accounts, totalCount, isLoading }: PendingClergyListProps) {
  if (isLoading) return <PendingClergyListSkeleton />;

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="size-6 text-green-500" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Aucun compte en attente
        </p>
        <p className="text-xs text-muted-foreground">
          Tous les comptes clergé ont été traités.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="size-4" />
        <span>{totalCount} compte{totalCount > 1 ? 's' : ''} en attente de validation</span>
      </div>
      {accounts.map((account) => (
        <PendingClergyCard key={account.id} account={account} />
      ))}
    </div>
  );
}
