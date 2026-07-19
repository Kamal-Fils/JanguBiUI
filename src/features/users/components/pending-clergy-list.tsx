'use client';

import { CheckCircle, Clock, FileText, XCircle } from 'lucide-react';
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
            {/* Pleine opacité et 12 px : un surtitre atténué à 10 px n'est pas
                lisible sur un téléphone modeste en plein soleil (R3). */}
            <CardEyebrow className="text-xs text-secondary-foreground dark:text-primary">
              {eyebrow}
            </CardEyebrow>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <span className="truncate font-serif text-lg font-bold tracking-tight text-foreground">
                {fullName}
              </span>
              <RoleBadge role={account.pastoral_role} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {account.email}
            </p>
            {account.parish_name && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Paroisse · {account.parish_name}
              </p>
            )}
            {/* Le dossier d'auto-déclaration : sans le justificatif ni le mot du
                demandeur, approuver ou refuser se ferait à l'aveugle. */}
            {account.declaration_message && (
              <p className="mt-2 max-w-prose text-sm text-foreground">
                « {account.declaration_message} »
              </p>
            )}
            {account.justification_file_url && (
              <a
                href={account.justification_file_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex min-h-11 items-center gap-1.5 text-sm text-primary underline underline-offset-4"
              >
                <FileText className="size-3.5" aria-hidden="true" />
                Consulter le justificatif
              </a>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            {/* L'action principale est BLEUE : le bleu porte l'identité et
                l'action, l'or n'est qu'un accent (DIRECTION.md R4). */}
            <Button
              size="sm"
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
      {/* Compteur de file : 12 px pleine opacité et bleu profond en thème clair
          — le bleu de marque ne tient pas 4,5:1 sur blanc en petit texte (R3). */}
      <div className="flex items-center gap-2 text-secondary-foreground dark:text-primary">
        <Clock className="size-4" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em]">
          {totalCount} compte{totalCount > 1 ? 's' : ''} en attente de
          validation
        </p>
      </div>
      {/* Filet bleu — l'or reste un accent (DIRECTION.md R4). */}
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-primary/35 to-transparent"
        aria-hidden="true"
      />
      {accounts.map((account) => (
        <PendingClergyCard key={account.id} account={account} />
      ))}
    </div>
  );
}
