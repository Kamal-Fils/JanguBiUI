'use client';

import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { Card, CardEyebrow } from '@/components/ui/card/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { RoleBadge } from '@/components/ui/role-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { roleLabel } from '@/config/roles';

import { PendingClergyAccount } from '../api/get-pending-clergy';
import {
  useApproveClergy,
  useRejectClergyAccount,
} from '../api/validate-clergy-account';

function PendingClergyCard({ account }: { account: PendingClergyAccount }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { mutate: approve, isPending: approving } = useApproveClergy();
  const { mutate: reject, isPending: rejecting } = useRejectClergyAccount();

  const fullName =
    [account.first_name, account.last_name].filter(Boolean).join(' ') ||
    account.email;

  const eyebrow = [roleLabel(account.pastoral_role), account.diocese_name]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Card variant="sacred" className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardEyebrow className="text-primary/70">{eyebrow}</CardEyebrow>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <span className="truncate font-serif text-lg font-bold tracking-tight text-foreground">
                {fullName}
              </span>
              <RoleBadge role={account.pastoral_role} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{account.email}</p>
            {account.parish_name && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Paroisse · {account.parish_name}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="gold"
              onClick={() => approve(account.id)}
              disabled={approving}
              isLoading={approving}
              icon={<CheckCircle className="size-3.5" aria-hidden="true" />}
            >
              Approuver
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setRejectOpen(true)}
              icon={<XCircle className="size-3.5" aria-hidden="true" />}
            >
              Refuser
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le compte de {fullName}</DialogTitle>
            <DialogDescription>
              Un email de notification sera envoyé à {account.email}.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="reject-reason" className="sr-only">
            Motif du refus
          </label>
          <Textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Motif du refus (requis)…"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejecting}
              isLoading={rejecting}
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
              Confirmer le refus
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
        <Card key={i} variant="sacred" className="space-y-2 p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-32" />
        </Card>
      ))}
    </div>
  );
}

interface PendingClergyListProps {
  accounts: PendingClergyAccount[];
  totalCount: number;
  isLoading?: boolean;
}

export function PendingClergyList({
  accounts,
  totalCount,
  isLoading,
}: PendingClergyListProps) {
  if (isLoading) return <PendingClergyListSkeleton />;

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={<CheckCircle />}
        title="Aucun compte en attente"
        description="Tous les comptes clergé ont été traités. Les prochaines auto-déclarations apparaîtront ici pour validation."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <Clock className="size-4" aria-hidden="true" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
          {totalCount} compte{totalCount > 1 ? 's' : ''} en attente de validation
        </p>
      </div>
      <div className="hairline-gold" aria-hidden="true" />
      {accounts.map((account) => (
        <PendingClergyCard key={account.id} account={account} />
      ))}
    </div>
  );
}
