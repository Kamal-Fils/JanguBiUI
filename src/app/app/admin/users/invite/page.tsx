'use client';

import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
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
    <AppShell>
      <div className="flex flex-col">
        <PageHeader
          title="Inviter du clergé"
          subtitle="Un email d'invitation sera envoyé. Le lien est valable 48h."
        />
        <div className="mx-auto w-full max-w-lg px-4 py-6">
          <InvitationForm
            onSuccess={() =>
              router.push(paths.app.admin.users.invitations.getHref())
            }
          />
        </div>
      </div>
    </AppShell>
  );
}
