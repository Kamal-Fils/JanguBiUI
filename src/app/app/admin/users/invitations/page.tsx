'use client';

import Link from 'next/link';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Button } from '@/components/ui/button/button';
import { ErrorState } from '@/components/ui/error-state';
import { paths } from '@/config/paths';
import { useInvitations } from '@/features/clergy-accounts/api/get-invitations';
import { InvitationList } from '@/features/clergy-accounts/components/invitation-list';
import { canManageClergy } from '@/lib/authorization';

export default function InvitationsPage() {
  const { data, isLoading, isError, refetch } = useInvitations();

  return (
    <AdminPageLayout
      title="Invitations clergé"
      subtitle="Gérez les invitations envoyées aux membres du clergé"
      allow={canManageClergy}
      headerAction={
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={paths.app.admin.users.validation.getHref()}>
              Validations en attente
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={paths.app.admin.users.invite.getHref()}>
              + Nouvelle invitation
            </Link>
          </Button>
        </div>
      }
    >
      {/* Archétype **Travail** — vocabulaire de `/app/admin/documents`. */}
      <section aria-labelledby="invitations-title">
        <h2
          id="invitations-title"
          className="mb-2 text-sm font-semibold text-foreground"
        >
          Suivi des invitations
        </h2>
        {isError ? (
          <ErrorState
            title="Impossible de charger les invitations"
            onRetry={() => refetch()}
          />
        ) : (
          <InvitationList
            invitations={data?.results ?? []}
            isLoading={isLoading}
          />
        )}
      </section>
    </AdminPageLayout>
  );
}
