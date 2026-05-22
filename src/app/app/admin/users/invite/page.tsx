'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { paths } from '@/config/paths';
import { InvitationForm } from '@/features/clergy-accounts/components/invitation-form';
import { useUser } from '@/lib/auth';
import { canManageClergy } from '@/lib/authorization';

export default function InvitePage() {
  const { data: user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !canManageClergy(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, isLoading, router]);

  if (isLoading || (user && !canManageClergy(user))) return null;

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
