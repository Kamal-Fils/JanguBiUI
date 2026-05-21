'use client';

import { RotateCcw } from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';

import { useRevokeInvitation } from '../api/revoke-invitation';
import { ClergicalInvitation } from '../types';

import { InvitationStatusBadge } from './invitation-status-badge';

const ROLE_LABELS: Record<string, string> = {
  pretre: 'Prêtre',
  diacre: 'Diacre',
  religieux: 'Religieux/Religieuse',
  eveque: 'Évêque',
  archeveque: 'Archevêque',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface InvitationListProps {
  invitations: ClergicalInvitation[];
  isLoading?: boolean;
}

export function InvitationList({
  invitations,
  isLoading,
}: InvitationListProps) {
  const [revokeTarget, setRevokeTarget] = useState<ClergicalInvitation | null>(
    null,
  );
  const revoke = useRevokeInvitation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Aucune invitation.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">
                    {inv.first_name} {inv.last_name}
                  </span>
                  <InvitationStatusBadge status={inv.status} />
                </div>
                <p className="text-sm text-muted-foreground">{inv.email}</p>
                <p className="text-xs text-muted-foreground">
                  Rôle : {ROLE_LABELS[inv.pastoral_role] ?? inv.pastoral_role}
                  {inv.diocese_name && ` — ${inv.diocese_name}`}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Expire le {formatDate(inv.expires_at)}
                </p>
              </div>

              {inv.status === 'pending' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRevokeTarget(inv)}
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Révoquer
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Révoquer l&apos;invitation</DialogTitle>
            <DialogDescription>
              L&apos;invitation de {revokeTarget?.email} sera révoquée et ne
              pourra plus être utilisée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={revoke.isPending}
              onClick={() => {
                if (!revokeTarget) return;
                revoke.mutate(revokeTarget.id, {
                  onSuccess: () => setRevokeTarget(null),
                });
              }}
            >
              {revoke.isPending ? <Spinner className="size-4" /> : 'Révoquer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
