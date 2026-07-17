'use client';

import Link from 'next/link';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Button } from '@/components/ui/button/button';
import { Card, CardContent, CardEyebrow } from '@/components/ui/card/card';
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
      <Card variant="feature">
        <CardContent className="p-4 sm:p-5">
          <CardEyebrow className="mb-3">Suivi des invitations</CardEyebrow>
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
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
