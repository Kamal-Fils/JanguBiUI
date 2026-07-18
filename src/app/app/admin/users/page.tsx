'use client';

import { MoreHorizontal, UserCheck, UserX, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardEyebrow } from '@/components/ui/card/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { RoleBadge } from '@/components/ui/role-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { paths } from '@/config/paths';
import {
  useAdminUsers,
  type AdminUser,
} from '@/features/users/api/get-admin-users';
import { useToggleUserActive } from '@/features/users/api/toggle-user-active';
import { useUser } from '@/lib/auth';
import { canManageUsers, isSuperAdmin } from '@/lib/authorization';
import { cn } from '@/lib/utils';

// Filtres mixtes (F3b) : dimension admin (`role`) ET identité pastorale
// (`pastoral_role`). Chaque option porte son `param` → le clergé se filtre par
// pastoral_role (le bon champ ; ?role=pretre ne renverrait rien, role ∈ admin).
const FILTER_OPTIONS = [
  { value: '', label: 'Tous', param: 'role' },
  { value: 'super_admin', label: 'Super Admin', param: 'role' },
  { value: 'parish_admin', label: 'Paroisse', param: 'role' },
  { value: 'pretre', label: 'Prêtres', param: 'pastoral_role' },
  { value: 'eveque', label: 'Évêques', param: 'pastoral_role' },
  { value: 'fidele', label: 'Fidèles', param: 'role' },
] as const;

const PAGE_SIZE = 20;

/** En-têtes de colonnes « admin sobre » : micro-capitales espacées. */
const TH_CLASS = 'text-[11px] uppercase tracking-wide text-muted-foreground';

function userName(u: AdminUser): string {
  if (u.user_profile) {
    const full =
      `${u.user_profile.first_name} ${u.user_profile.last_name}`.trim();
    if (full) return full;
  }
  return u.email;
}

/** Actions par ligne regroupées dans un menu « ⋯ » + confirmation AlertDialog. */
function UserRowActions({ user }: { user: AdminUser }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate: toggleActive, isPending } = useToggleUserActive();
  const action = user.is_active ? 'Désactiver' : 'Activer';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions pour ${userName(user)}`}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {user.is_active ? (
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              disabled={isPending}
              onSelect={() => setConfirmOpen(true)}
            >
              <UserX className="mr-2 size-4" aria-hidden="true" />
              Désactiver
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={isPending}
              onSelect={() => setConfirmOpen(true)}
            >
              <UserCheck className="mr-2 size-4" aria-hidden="true" />
              Activer
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{action} ce compte&nbsp;?</AlertDialogTitle>
            <AlertDialogDescription>
              {user.is_active
                ? `${userName(user)} ne pourra plus se connecter tant que le compte est désactivé.`
                : `${userName(user)} pourra de nouveau accéder à la plateforme.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => toggleActive(user.id)}>
              {action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState('');
  const [offset, setOffset] = useState(0);

  const { data: currentUser } = useUser();

  const selected =
    FILTER_OPTIONS.find((o) => o.value === roleFilter) ?? FILTER_OPTIONS[0];
  const { data, isLoading, isError, refetch } = useAdminUsers({
    role:
      selected.param === 'role' && selected.value ? selected.value : undefined,
    pastoral_role:
      selected.param === 'pastoral_role' && selected.value
        ? selected.value
        : undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    setOffset(0);
  };

  const columns: DataTableColumn<AdminUser>[] = [
    {
      header: 'Utilisateur',
      mobileLabel: 'Nom',
      headClassName: TH_CLASS,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <UserAvatar
            name={userName(u)}
            email={u.email}
            size="sm"
            className="hidden md:flex"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {userName(u)}
            </p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Rôle',
      headClassName: TH_CLASS,
      // Dimension admin (role) + identité pastorale (pastoral_role) si clergé :
      // un curé = « Paroisse » + « Prêtre » ; un vicaire = « Fidèle » + « Prêtre ».
      cell: (u) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <RoleBadge role={u.role} />
          {u.pastoral_role && u.pastoral_role !== 'fidele' && (
            <RoleBadge role={u.pastoral_role} />
          )}
        </div>
      ),
    },
    {
      header: 'Statut',
      headClassName: TH_CLASS,
      cell: (u) =>
        u.is_active ? (
          <StatusBadge tone="success" label="Actif" />
        ) : (
          <StatusBadge tone="danger" label="Inactif" />
        ),
    },
    {
      header: 'Actions',
      isAction: true,
      headClassName: cn(TH_CLASS, 'text-right'),
      className: 'text-right',
      cell: (u) => <UserRowActions user={u} />,
    },
  ];

  return (
    <AdminPageLayout
      title="Utilisateurs"
      subtitle="Gérer les comptes et leur accès à la plateforme"
      allow={canManageUsers}
      headerAction={
        // V1 (REQ-USER-03) : seul super_admin crée des comptes. On masque le
        // bouton pour les autres admins (diocèse/province) → plus de dead-end
        // (la page d'invitation est gardée par canManageClergy, qui les rejette).
        isSuperAdmin(currentUser) ? (
          <Button asChild size="sm">
            <Link href={paths.app.admin.users.invite.getHref()}>
              + Inviter clergé
            </Link>
          </Button>
        ) : undefined
      }
      toolbar={
        <FilterPills
          options={FILTER_OPTIONS.map(({ value, label }) => ({ value, label }))}
          value={roleFilter}
          onChange={handleRoleChange}
          ariaLabel="Filtrer par rôle"
        />
      }
    >
      <Card variant="feature">
        <CardContent className="p-4 sm:p-5">
          <CardEyebrow className="mb-3">Comptes &amp; accès</CardEyebrow>
          {isError ? (
            <ErrorState
              title="Impossible de charger les utilisateurs"
              onRetry={() => refetch()}
            />
          ) : (
            <DataTable
              data={data?.results}
              columns={columns}
              rowKey={(u) => u.id}
              isLoading={isLoading}
              caption="Liste des utilisateurs"
              emptyState={
                <EmptyState
                  icon={<UsersIcon />}
                  title="Aucun utilisateur pour ce filtre"
                  description="Élargissez le filtre pour retrouver un compte, ou invitez un membre du clergé à rejoindre la plateforme."
                />
              }
              pagination={{
                count: data?.count ?? 0,
                limit: PAGE_SIZE,
                offset,
                onOffsetChange: setOffset,
              }}
            />
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
