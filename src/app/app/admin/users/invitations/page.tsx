'use client';

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui/button/button';
import { paths } from '@/config/paths';
import { useInvitations } from '@/features/clergy-accounts/api/get-invitations';
import { InvitationList } from '@/features/clergy-accounts/components/invitation-list';
import { useUser } from '@/lib/auth';
import { canManageClergy } from '@/lib/authorization';

export default function InvitationsPage() {
  const { data: user } = useUser();

  if (user && !canManageClergy(user)) {
    redirect(paths.app.root.getHref());
  }

  const { data, isLoading } = useInvitations();

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader
          title="Invitations clergé"
          subtitle="Gérez les invitations envoyées aux membres du clergé"
        />
        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
          <div className="mb-4 flex justify-end gap-2">
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
          <InvitationList invitations={data?.results ?? []} isLoading={isLoading} />
        </div>
      </div>
    </AppShell>
  );
}
