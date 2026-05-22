'use client';

import Link from 'next/link';
import { redirect } from 'next/navigation';

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
    <div className="space-y-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Invitations clergé
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez les invitations envoyées aux membres du clergé.
          </p>
        </div>
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
      </div>

      <InvitationList invitations={data?.results ?? []} isLoading={isLoading} />
    </div>
  );
}
