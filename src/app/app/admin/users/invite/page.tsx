'use client';

import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';
import { InvitationForm } from '@/features/clergy-accounts/components/invitation-form';
import { useUser } from '@/lib/auth';
import { canManageClergy } from '@/lib/authorization';

export default function InvitePage() {
  const { data: user } = useUser();
  const router = useRouter();

  if (user && !canManageClergy(user)) {
    redirect(paths.app.root.getHref());
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Inviter un membre du clergé
        </h1>
        <p className="text-sm text-muted-foreground">
          Un email d&apos;invitation sera envoyé à l&apos;adresse indiquée. Le
          lien est valable 48 heures.
        </p>
      </div>

      <InvitationForm
        onSuccess={() =>
          router.push(paths.app.admin.users.invitations.getHref())
        }
      />
    </div>
  );
}
