'use client';

import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { usePendingClergy } from '@/features/users/api/get-pending-clergy';
import { PendingClergyList } from '@/features/users/components/pending-clergy-list';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { canManageClergy } from '@/lib/authorization';

export default function ClergyValidationPage() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data, isLoading: dataLoading } = usePendingClergy();

  if (!userLoading && !canManageClergy(user)) {
    redirect(paths.app.root.getHref());
  }

  if (userLoading || !canManageClergy(user)) return null;

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader
          title="Validation des comptes clergé"
          subtitle="Approuver ou refuser les comptes en attente de validation hiérarchique"
        />
        <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
          <PendingClergyList
            accounts={data?.results ?? []}
            isLoading={dataLoading}
          />
        </div>
      </div>
    </AppShell>
  );
}
