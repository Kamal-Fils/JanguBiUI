'use client';

import { MailPlus, MoreHorizontal, RotateCcw } from 'lucide-react';
import Link from 'next/link';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { EmptyState } from '@/components/ui/empty-state';
import { RoleBadge } from '@/components/ui/role-badge';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { formatFrDate } from '@/utils/format-date';

import { useRevokeInvitation } from '../api/revoke-invitation';
import { ClergicalInvitation } from '../types';

import { InvitationStatusBadge } from './invitation-status-badge';

/** En-têtes de colonnes « admin sobre » : micro-capitales espacées. */
const TH_CLASS = 'text-[11px] uppercase tracking-wide text-muted-foreground';

interface InvitationRowActionsProps {
  invitation: ClergicalInvitation;
  onRevokeRequest: (invitation: ClergicalInvitation) => void;
}

/** Actions par ligne dans un menu « ⋯ » — visibles uniquement si révocable. */
function InvitationRowActions({
  invitation,
  onRevokeRequest,
}: InvitationRowActionsProps) {
  if (invitation.status !== 'pending') return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions pour ${invitation.email}`}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={() => onRevokeRequest(invitation)}
        >
          <RotateCcw className="mr-2 size-4" aria-hidden="true" />
          Révoquer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
      headClassName: TH_CLASS,
      cell: (inv) => (
        <div className="min-w-0">
          <p className="truncate font-serif text-sm font-semibold text-foreground">
            {inv.first_name} {inv.last_name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{inv.email}</p>
        </div>
      ),
    },
    {
      header: 'Rôle',
      mobileLabel: 'Rôle',
      headClassName: TH_CLASS,
      cell: (inv) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <RoleBadge role={inv.pastoral_role} />
          {inv.diocese_name && (
            <span className="text-xs text-muted-foreground">
              {inv.diocese_name}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Statut',
      mobileLabel: 'Statut',
      headClassName: TH_CLASS,
      cell: (inv) => <InvitationStatusBadge status={inv.status} />,
    },
    {
      header: 'Expiration',
      mobileLabel: 'Expire le',
      headClassName: TH_CLASS,
      cell: (inv) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatFrDate(inv.expires_at, 'short')}
        </span>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      headClassName: cn(TH_CLASS, 'text-right'),
      className: 'text-right',
      cell: (inv) => (
        <InvitationRowActions
          invitation={inv}
          onRevokeRequest={setRevokeTarget}
        />
      ),
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
            icon={<MailPlus />}
            title="Invitez votre premier membre du clergé"
            description="Prêtres, diacres, religieux… Envoyez une invitation par email : le compte est pré-rempli et validé à l'acceptation."
            action={
              <Link
                href={paths.app.admin.users.invite.getHref()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
              >
                <MailPlus className="size-4" aria-hidden="true" />
                Nouvelle invitation
              </Link>
            }
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
              isLoading={revoke.isPending}
              onClick={() => {
                if (!revokeTarget) return;
                revoke.mutate(revokeTarget.id, {
                  onSuccess: () => setRevokeTarget(null),
                });
              }}
            >
              Révoquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
