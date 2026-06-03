'use client';

import { MailX, RotateCcw } from 'lucide-react';
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
import { EmptyState } from '@/components/ui/empty-state';
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

  const columns: DataTableColumn<ClergicalInvitation>[] = [
    {
      header: 'Invité',
      mobileLabel: 'Invité',
      cell: (inv) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {inv.first_name} {inv.last_name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{inv.email}</p>
        </div>
      ),
    },
    {
      header: 'Rôle',
      mobileLabel: 'Rôle',
      cell: (inv) => (
        <span className="text-sm text-muted-foreground">
          {ROLE_LABELS[inv.pastoral_role] ?? inv.pastoral_role}
          {inv.diocese_name && ` — ${inv.diocese_name}`}
        </span>
      ),
    },
    {
      header: 'Statut',
      mobileLabel: 'Statut',
      cell: (inv) => <InvitationStatusBadge status={inv.status} />,
    },
    {
      header: 'Expiration',
      mobileLabel: 'Expire le',
      cell: (inv) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(inv.expires_at)}
        </span>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      cell: (inv) =>
        inv.status === 'pending' ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setRevokeTarget(inv)}
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            Révoquer
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        data={invitations}
        columns={columns}
        rowKey={(inv) => inv.id}
        isLoading={isLoading}
        caption="Liste des invitations cléricales"
        emptyState={
          <EmptyState
            icon={<MailX />}
            title="Aucune invitation"
            description="Aucune invitation cléricale n'a encore été envoyée."
          />
        }
      />

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
